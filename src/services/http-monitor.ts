import { type RecordingService } from './recording.service';
import { escapeSingleQuotes } from '../utils/code-format.utils';

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

const SAFE_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function buildValidations(base: string, obj: Record<string, unknown>): string {
  return Object.keys(obj)
    .filter((key) => key !== 'id' && key !== 'uid')
    .map((key) => {
      const accessor = SAFE_IDENTIFIER.test(key)
        ? `.${key}`
        : `['${escapeSingleQuotes(key)}']`;
      return `expect(${base}${accessor}).to.equal(${JSON.stringify(obj[key])});`;
    })
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

/** Returns pretty-printed JSON (objects OR arrays) for a fixture, or null. */
function prettyJsonOrNull(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') return JSON.stringify(parsed, null, 2);
  } catch {
    // not JSON
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

  isFixtureModeEnabled(): boolean {
    return localStorage.getItem('fixtureMode') === 'true';
  }

  private installFetch(): void {
    if (this.originalFetch) return;
    const originalFetch = window.fetch;
    this.originalFetch = originalFetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await originalFetch(input, init);
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

    // Always register a spy interceptor — the fixture-stub form is applied at
    // save time (spec 012) so we don't lock the format before knowing which
    // save action the user will choose.
    this.recording.registerInterceptor(method, url, alias);

    const extendedHttp = this.isExtendedHttpEnabled();
    const fixtureMode = this.isFixtureModeEnabled();
    const requestBody = extendedHttp ? parseRequestBody(init) : null;

    let responseText: string | null = null;
    let responseBody: Record<string, unknown> | null = null;

    if (extendedHttp || (fixtureMode && method === 'GET')) {
      try {
        responseText = await responseClone.text();
        if (extendedHttp) responseBody = parseJsonObject(responseText);
      } catch {
        // Unreadable body — continue without validations
      }
    }

    // Capture response JSON for potential fixture use at save-and-export time.
    if (fixtureMode && method === 'GET' && responseText !== null) {
      const pretty = prettyJsonOrNull(responseText);
      if (pretty !== null) this.recording.registerFixture(`${alias}.json`, pretty);
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

    // Always register a spy interceptor (fixture-stub form is applied at save time).
    this.recording.registerInterceptor(method, url, alias);

    // Capture response JSON for potential fixture use at save-and-export time.
    if (this.isFixtureModeEnabled() && method === 'GET') {
      const pretty = prettyJsonOrNull(responseText);
      if (pretty !== null) this.recording.registerFixture(`${alias}.json`, pretty);
    }

    const extendedHttp = this.isExtendedHttpEnabled();
    const responseBody = extendedHttp ? parseJsonObject(responseText) : null;

    const cmd = buildCyWaitCommand(method, alias, extendedHttp, requestBody, responseBody);
    this.recording.addCommand(cmd);
  }
}

