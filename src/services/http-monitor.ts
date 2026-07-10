import { type RecordingService } from './recording.service';
import { escapeSingleQuotes } from '../utils/code-format.utils';
import { redactSensitiveFields } from '../utils/redact.utils';

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

// ─── module-level interception handlers ──────────────────────────────────────

async function _handleFetchInterception(
  recording: RecordingService,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  responseClone: Response
): Promise<void> {
  const method = resolveMethod(input, init);
  if (!(INTERCEPTED_METHODS as readonly string[]).includes(method)) return;

  const url = resolveUrl(input);
  const alias = generateAlias(method, url);

  recording.registerInterceptor(method, url, alias);

  const extendedHttp = localStorage.getItem('extendedHttpCommands') === 'true';
  const fixtureMode = localStorage.getItem('fixtureMode') === 'true';
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

  if (fixtureMode && method === 'GET' && responseText !== null) {
    const pretty = prettyJsonOrNull(responseText);
    if (pretty !== null) {
      const redacted = redactSensitiveFields(JSON.parse(pretty));
      recording.registerFixture(`${alias}.json`, JSON.stringify(redacted, null, 2));
    }
  }

  const cmd = buildCyWaitCommand(
    method, alias, extendedHttp,
    requestBody ? redactSensitiveFields(requestBody) as Record<string, unknown> : null,
    responseBody ? redactSensitiveFields(responseBody) as Record<string, unknown> : null,
  );
  recording.addCommand(cmd);
}

function _handleXhrInterception(
  recording: RecordingService,
  method: string,
  url: string,
  requestBody: Record<string, unknown> | null,
  responseText: string
): void {
  if (!(INTERCEPTED_METHODS as readonly string[]).includes(method as InterceptedMethod)) return;

  const alias = generateAlias(method, url);

  recording.registerInterceptor(method, url, alias);

  if (localStorage.getItem('fixtureMode') === 'true' && method === 'GET') {
    const pretty = prettyJsonOrNull(responseText);
    if (pretty !== null) {
      const redacted = redactSensitiveFields(JSON.parse(pretty));
      recording.registerFixture(`${alias}.json`, JSON.stringify(redacted, null, 2));
    }
  }

  const extendedHttp = localStorage.getItem('extendedHttpCommands') === 'true';
  const responseBody = extendedHttp ? parseJsonObject(responseText) : null;

  const cmd = buildCyWaitCommand(
    method, alias, extendedHttp,
    requestBody ? redactSensitiveFields(requestBody) as Record<string, unknown> : null,
    responseBody ? redactSensitiveFields(responseBody) as Record<string, unknown> : null,
  );
  recording.addCommand(cmd);
}

// ─── module-level singleton state ────────────────────────────────────────────

let _refCount = 0;
let _originalFetch: typeof window.fetch | null = null;
let _originalXHR: typeof XMLHttpRequest | null = null;
const _recordings = new Set<RecordingService>();

function _patchFetch(): void {
  const orig = window.fetch;
  _originalFetch = orig;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await orig(input, init);
    try {
      const active = [..._recordings];
      if (active.length > 0) {
        await Promise.all(
          active.map((rec) => _handleFetchInterception(rec, input, init, response.clone()).catch(() => {}))
        );
      }
    } catch {
      // Never let monitoring errors break the actual request
    }
    return response;
  };
}

function _restoreFetch(): void {
  if (!_originalFetch) return;
  window.fetch = _originalFetch;
  _originalFetch = null;
}

function _patchXhr(): void {
  const OrigXHR = window.XMLHttpRequest;
  _originalXHR = OrigXHR;

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
          for (const rec of _recordings) {
            _handleXhrInterception(rec, this._xhrMethod, this._xhrUrl, this._xhrRequestBody, this.responseText);
          }
        } catch {
          // Never let monitoring errors surface
        }
      });
      super.send(body);
    }
  } as unknown as typeof XMLHttpRequest;
}

function _restoreXhr(): void {
  if (!_originalXHR) return;
  window.XMLHttpRequest = _originalXHR;
  _originalXHR = null;
}

/** @internal — resets singleton state between test suites; do not use in production code */
export function _resetHttpMonitorState(): void {
  _refCount = 0;
  _originalFetch = null;
  _originalXHR = null;
  _recordings.clear();
}

// ─── HttpMonitor — public API (thin wrapper over the module-level singleton) ─

export class HttpMonitor {
  constructor(private readonly recording: RecordingService) {}

  install(): void {
    _recordings.add(this.recording);
    _refCount++;
    if (_refCount === 1) {
      _patchFetch();
      _patchXhr();
    }
  }

  uninstall(): void {
    _recordings.delete(this.recording);
    if (_refCount <= 0) return;
    _refCount--;
    if (_refCount === 0) {
      _restoreFetch();
      _restoreXhr();
    }
  }

  isExtendedHttpEnabled(): boolean {
    return localStorage.getItem('extendedHttpCommands') === 'true';
  }

  isFixtureModeEnabled(): boolean {
    return localStorage.getItem('fixtureMode') === 'true';
  }
}
