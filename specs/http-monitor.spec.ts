import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { HttpMonitor, generateAlias } from '../src/services/http-monitor';
import { RecordingService } from '../src/services/recording.service';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function lastCommand(service: RecordingService): string {
  return service.getCommandsSnapshot().at(-1) ?? '';
}

function lastInterceptor(service: RecordingService): string {
  return service.getInterceptorsSnapshot().at(-1) ?? '';
}

// ─── suite ──────────────────────────────────────────────────────────────────

describe('Phase 6 — HttpMonitor', () => {
  let recording: RecordingService;
  let monitor: HttpMonitor;
  let originalFetch: typeof fetch;
  let mockFetch: Mock;

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();

    recording = new RecordingService();
    recording.startRecording();

    originalFetch = window.fetch;
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    monitor = new HttpMonitor(recording);
  });

  afterEach(() => {
    monitor.uninstall();
    recording.destroy();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ── install / uninstall ──────────────────────────────────────────────────

  describe('install / uninstall', () => {
    it('install replaces window.fetch with a patched version', () => {
      monitor.install();
      expect(window.fetch).not.toBe(mockFetch);
    });

    it('uninstall restores the original fetch', () => {
      monitor.install();
      monitor.uninstall();
      expect(window.fetch).toBe(mockFetch);
    });

    it('calling install twice does not double-patch', () => {
      monitor.install();
      const patchedOnce = window.fetch;
      monitor.install();
      expect(window.fetch).toBe(patchedOnce);
    });
  });

  // ── isExtendedHttpEnabled ────────────────────────────────────────────────

  describe('isExtendedHttpEnabled', () => {
    it('returns false when localStorage key is absent', () => {
      expect(monitor.isExtendedHttpEnabled()).toBe(false);
    });

    it('returns true when localStorage.extendedHttpCommands is "true"', () => {
      localStorage.setItem('extendedHttpCommands', 'true');
      expect(monitor.isExtendedHttpEnabled()).toBe(true);
    });

    it('returns false when localStorage.extendedHttpCommands is "false"', () => {
      localStorage.setItem('extendedHttpCommands', 'false');
      expect(monitor.isExtendedHttpEnabled()).toBe(false);
    });
  });

  // ── fetch interception ───────────────────────────────────────────────────

  describe('fetch interception', () => {
    it('GET request registers an interceptor', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ ok: true }));
      monitor.install();
      await fetch('/api/users');
      expect(lastInterceptor(recording)).toContain("cy.intercept('GET'");
    });

    it('GET request adds a cy.wait command', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ ok: true }));
      monitor.install();
      await fetch('/api/users');
      expect(lastCommand(recording)).toContain("cy.wait('@");
    });

    it('POST request registers an interceptor', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ id: 1 }));
      monitor.install();
      await fetch('/api/users', { method: 'POST', body: JSON.stringify({ name: 'Alice' }) });
      expect(lastInterceptor(recording)).toContain("cy.intercept('POST'");
    });

    it('PUT request registers an interceptor', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ id: 1 }));
      monitor.install();
      await fetch('/api/users/1', { method: 'PUT', body: JSON.stringify({ name: 'Bob' }) });
      expect(lastInterceptor(recording)).toContain("cy.intercept('PUT'");
    });

    it('DELETE request is ignored', async () => {
      mockFetch.mockResolvedValue(new Response(null, { status: 204 }));
      monitor.install();
      const before = recording.getCommandsSnapshot().length;
      await fetch('/api/users/1', { method: 'DELETE' });
      expect(recording.getCommandsSnapshot().length).toBe(before);
    });

    it('when not recording, no commands are added', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ ok: true }));
      recording.stopRecording();
      monitor.install();
      const before = recording.getCommandsSnapshot().length;
      await fetch('/api/users');
      expect(recording.getCommandsSnapshot().length).toBe(before);
    });

    it('uninstalled monitor does not intercept', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ ok: true }));
      monitor.install();
      monitor.uninstall();
      const before = recording.getInterceptorsSnapshot().length;
      await fetch('/api/users');
      expect(recording.getInterceptorsSnapshot().length).toBe(before);
    });
  });

  // ── cy.wait command format ───────────────────────────────────────────────

  describe('cy.wait command format', () => {
    it('without extendedHttp → default empty then block', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ name: 'Alice' }));
      monitor.install();
      await fetch('/api/users');
      expect(lastCommand(recording)).toBe("cy.wait('@get-api-users').then((interception) => { })");
    });

    it('GET + extendedHttp + object body → adds response validations', async () => {
      localStorage.setItem('extendedHttpCommands', 'true');
      mockFetch.mockResolvedValue(makeJsonResponse({ name: 'Alice', role: 'admin' }));
      monitor.install();
      await fetch('/api/users');
      const cmd = lastCommand(recording);
      expect(cmd).toContain('interception.response.body.name');
      expect(cmd).toContain('"Alice"');
    });

    it('GET + extendedHttp + array body → default (no validations)', async () => {
      localStorage.setItem('extendedHttpCommands', 'true');
      mockFetch.mockResolvedValue(makeJsonResponse([{ id: 1 }, { id: 2 }]));
      monitor.install();
      await fetch('/api/users');
      expect(lastCommand(recording)).toBe("cy.wait('@get-api-users').then((interception) => { })");
    });

    it('POST + extendedHttp + object body → adds request validations', async () => {
      localStorage.setItem('extendedHttpCommands', 'true');
      mockFetch.mockResolvedValue(makeJsonResponse({ id: 1 }));
      monitor.install();
      await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'Alice', role: 'admin' }),
      });
      const cmd = lastCommand(recording);
      expect(cmd).toContain('interception.request.body.name');
      expect(cmd).toContain('"Alice"');
    });

    it('validations skip "id" and "uid" fields', async () => {
      localStorage.setItem('extendedHttpCommands', 'true');
      mockFetch.mockResolvedValue(makeJsonResponse({ id: 42, uid: 'abc', name: 'Alice' }));
      monitor.install();
      await fetch('/api/users');
      const cmd = lastCommand(recording);
      expect(cmd).not.toContain('.id');
      expect(cmd).not.toContain('.uid');
      expect(cmd).toContain('.name');
    });

    it('non-JSON response body → default command (no throw)', async () => {
      mockFetch.mockResolvedValue(new Response('plain text', { status: 200 }));
      monitor.install();
      await expect(fetch('/api/text')).resolves.toBeDefined();
      expect(lastCommand(recording)).toContain("cy.wait('@");
    });
  });

  // ── XHR interception ────────────────────────────────────────────────────

  describe('XHR interception', () => {
    // FakeXHR fires 'load' via microtask so our subclass listener registers first
    class FakeXHR {
      status = 200;
      responseText = '{"ok":true}';
      private _l: Record<string, Array<() => void>> = {};
      open(_m: string, _u: string): void {}
      send(_body?: unknown): void {
        Promise.resolve().then(() => (this._l['load'] ?? []).forEach((fn) => fn()));
      }
      addEventListener(type: string, fn: () => void): void {
        (this._l[type] ??= []).push(fn);
      }
    }

    beforeEach(() => {
      vi.stubGlobal('XMLHttpRequest', FakeXHR);
    });

    function sendXhr(method: string, url: string, body?: string): Promise<void> {
      return new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        // resolve after our monitor listener (which is added in send())
        xhr.addEventListener('load', () => Promise.resolve().then(resolve));
        if (body) xhr.send(body); else xhr.send();
      });
    }

    it('GET via XHR registers an interceptor', async () => {
      monitor.install();
      await sendXhr('GET', '/api/users');
      expect(lastInterceptor(recording)).toContain("cy.intercept('GET'");
    });

    it('POST via XHR registers an interceptor', async () => {
      monitor.install();
      await sendXhr('POST', '/api/users', JSON.stringify({ name: 'Alice' }));
      expect(lastInterceptor(recording)).toContain("cy.intercept('POST'");
    });

    it('DELETE via XHR is ignored', async () => {
      monitor.install();
      const before = recording.getCommandsSnapshot().length;
      await sendXhr('DELETE', '/api/users/1');
      expect(recording.getCommandsSnapshot().length).toBe(before);
    });

    it('uninstall restores original XMLHttpRequest', () => {
      const fakeXhr = window.XMLHttpRequest;
      monitor.install();
      expect(window.XMLHttpRequest).not.toBe(fakeXhr);
      monitor.uninstall();
      expect(window.XMLHttpRequest).toBe(fakeXhr);
    });

    it('when not recording, XHR calls add no commands', async () => {
      recording.stopRecording();
      monitor.install();
      const before = recording.getCommandsSnapshot().length;
      await sendXhr('GET', '/api/users');
      expect(recording.getCommandsSnapshot().length).toBe(before);
    });
  });

  // ── generateAlias ────────────────────────────────────────────────────────

  describe('generateAlias', () => {
    it('GET /api/users → get-api-users', () => {
      expect(generateAlias('GET', 'http://localhost/api/users')).toBe('get-api-users');
    });

    it('POST /api/users → post-api-users', () => {
      expect(generateAlias('POST', 'http://localhost/api/users')).toBe('post-api-users');
    });

    it('strips query string from alias', () => {
      expect(generateAlias('GET', 'http://localhost/api/users?page=1')).toBe('get-api-users');
    });

    it('collapses multiple slashes into single dashes', () => {
      const alias = generateAlias('GET', 'http://localhost/api/v1/users/123');
      expect(alias).toBe('get-api-v1-users-123');
    });

    it('fallback for invalid URL', () => {
      expect(generateAlias('GET', ':::invalid')).toContain('get-');
    });
  });
});
