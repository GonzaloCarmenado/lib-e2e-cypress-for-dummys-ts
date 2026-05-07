import { type RecordingService } from './recording.service';

const INTERCEPTED_METHODS = ['GET', 'POST', 'PUT'] as const;
type InterceptedMethod = (typeof INTERCEPTED_METHODS)[number];

export function generateAlias(method: string, url: string): string {
  try {
    const u = new URL(url, 'http://localhost');
    const path = u.pathname
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-)|(-$)/g, '');
    return `${method.toLowerCase()}-${path}`;
  } catch {
    return `${method.toLowerCase()}-intercepted-request`;
  }
}

function buildValidations(base: string, obj: Record<string, unknown>): string {
  return Object.keys(obj)
    .filter((key) => key !== 'id' && key !== 'uid')
    .map((key) => `expect(${base}.${key}).to.equal(${JSON.stringify(obj[key])});`)
    .join('\n');
}

function buildCyWaitCommand(
  method: string,
  alias: string,
  extendedHttp: boolean,
  requestBody: Record<string, unknown> | null,
  responseBody: Record<string, unknown> | null
): string {
  if (extendedHttp && method === 'GET' && responseBody) {
    const validations = buildValidations('interception.response.body', responseBody);
    return `cy.wait('@${alias}').then((interception) => {\n  if (interception.response) {\n${validations}\n  }\n})`;
  }
  if (extendedHttp && (method === 'POST' || method === 'PUT') && requestBody) {
    const validations = buildValidations('interception.request.body', requestBody);
    return `cy.wait('@${alias}').then((interception) => {\n${validations}\n})`;
  }
  return `cy.wait('@${alias}').then((interception) => { })`;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Non-JSON or array — fall through
  }
  return null;
}

function parseRequestBody(init?: RequestInit): Record<string, unknown> | null {
  const body = init?.body;
  if (typeof body === 'string') return parseJsonObject(body);
  return null;
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function resolveMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (input instanceof Request) return input.method.toUpperCase();
  return 'GET';
}

export class HttpMonitor {
  private originalFetch: typeof window.fetch | null = null;
  private originalXHR: typeof XMLHttpRequest | null = null;

  constructor(private readonly recording: RecordingService) {}

  install(): void {
    this.installFetch();
    this.installXhr();
  }

  uninstall(): void {
    this.uninstallFetch();
    this.uninstallXhr();
  }

  isExtendedHttpEnabled(): boolean {
    return localStorage.getItem('extendedHttpCommands') === 'true';
  }

  private installFetch(): void {
    if (this.originalFetch) return;
    this.originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await this.originalFetch!(input, init);
      try {
        await this.handleFetchInterception(input, init, response.clone());
      } catch {
        // Never let monitoring errors break the actual request
      }
      return response;
    };
  }

  private uninstallFetch(): void {
    if (!this.originalFetch) return;
    window.fetch = this.originalFetch;
    this.originalFetch = null;
  }

  private installXhr(): void {
    if (this.originalXHR) return;
    this.originalXHR = window.XMLHttpRequest;
    const OrigXHR = this.originalXHR;
    const handleXhrInterception = this.handleXhrInterception.bind(this);

    window.XMLHttpRequest = class extends OrigXHR {
      private _xhrMethod = 'GET';
      private _xhrUrl = '';
      private _xhrRequestBody: Record<string, unknown> | null = null;

      override open(
        method: string,
        url: string | URL,
        async = true,
        user?: string | null,
        password?: string | null
      ): void {
        this._xhrMethod = method.toUpperCase();
        this._xhrUrl = url instanceof URL ? url.href : url;
        super.open(method, url as string, async, user, password);
      }

      override send(body?: Document | XMLHttpRequestBodyInit | null): void {
        if (typeof body === 'string') {
          this._xhrRequestBody = parseJsonObject(body);
        }
        this.addEventListener('load', () => {
          try {
            handleXhrInterception(
              this._xhrMethod,
              this._xhrUrl,
              this._xhrRequestBody,
              this.responseText
            );
          } catch {
            // Never let monitoring errors surface
          }
        });
        super.send(body);
      }
    } as unknown as typeof XMLHttpRequest;
  }

  private uninstallXhr(): void {
    if (!this.originalXHR) return;
    window.XMLHttpRequest = this.originalXHR;
    this.originalXHR = null;
  }

  private async handleFetchInterception(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    responseClone: Response
  ): Promise<void> {
    const method = resolveMethod(input, init);
    if (!(INTERCEPTED_METHODS as readonly string[]).includes(method)) return;

    const url = resolveUrl(input);
    const alias = generateAlias(method, url);

    this.recording.registerInterceptor(method, url, alias);

    const extendedHttp = this.isExtendedHttpEnabled();
    const requestBody = extendedHttp ? parseRequestBody(init) : null;
    let responseBody: Record<string, unknown> | null = null;
    if (extendedHttp) {
      try {
        responseBody = parseJsonObject(await responseClone.text());
      } catch {
        // Unreadable body — continue without validations
      }
    }

    const cmd = buildCyWaitCommand(method, alias, extendedHttp, requestBody, responseBody);
    this.recording.addCommand(cmd);
  }

  private handleXhrInterception(
    method: string,
    url: string,
    requestBody: Record<string, unknown> | null,
    responseText: string
  ): void {
    if (!(INTERCEPTED_METHODS as readonly string[]).includes(method as InterceptedMethod)) return;

    const alias = generateAlias(method, url);
    this.recording.registerInterceptor(method, url, alias);

    const extendedHttp = this.isExtendedHttpEnabled();
    const responseBody = extendedHttp ? parseJsonObject(responseText) : null;

    const cmd = buildCyWaitCommand(method, alias, extendedHttp, requestBody, responseBody);
    this.recording.addCommand(cmd);
  }
}

