import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { spawn } from 'node:child_process';
import {
  toSpecGlob,
  resolveExecutable,
  buildCommand,
  parseRunnerArgs,
  runSpec,
  createRunnerServer,
  startRunner,
  resolveAllowedOrigin,
  DEFAULT_COMMAND,
  DEFAULT_ALLOW_ORIGIN,
} from '../../src/runner/runner';

// ── fake spawn ───────────────────────────────────────────────────────────────

function fakeSpawn(opts: { code?: number; out?: string; errorEvent?: boolean }): typeof spawn {
  return ((_cmd: string, _args: string[]) => {
    const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    setTimeout(() => {
      if (opts.out) child.stdout.emit('data', opts.out);
      if (opts.errorEvent) child.emit('error', new Error('spawn failed'));
      else child.emit('close', opts.code ?? 0);
    }, 0);
    return child;
  }) as unknown as typeof spawn;
}

function httpRequest(
  port: number,
  method: string,
  path: string,
  body?: string,
  headers?: Record<string, string>,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path, headers }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── pure helpers ──────────────────────────────────────────────────────────────

describe('toSpecGlob', () => {
  it('turns a bare file name into a **/<name> glob', () => {
    expect(toSpecGlob('login.cy.ts')).toBe('**/login.cy.ts');
  });
  it('leaves a path as-is', () => {
    expect(toSpecGlob('cypress/e2e/login.cy.ts')).toBe('cypress/e2e/login.cy.ts');
  });
  it('returns empty for empty input', () => {
    expect(toSpecGlob('')).toBe('');
    expect(toSpecGlob('   ')).toBe('');
  });
});

describe('resolveExecutable', () => {
  it('appends .cmd to node shims on win32', () => {
    expect(resolveExecutable('npx', 'win32')).toBe('npx.cmd');
    expect(resolveExecutable('npm', 'win32')).toBe('npm.cmd');
  });
  it('leaves the command untouched on non-win32', () => {
    expect(resolveExecutable('npx', 'linux')).toBe('npx');
  });
  it('leaves non-shim commands untouched even on win32', () => {
    expect(resolveExecutable('cypress', 'win32')).toBe('cypress');
  });
});

describe('buildCommand', () => {
  it('substitutes {spec} as a single argv element', () => {
    expect(buildCommand(DEFAULT_COMMAND, '**/a.cy.ts')).toEqual({
      cmd: 'npx',
      args: ['cypress', 'run', '--spec', '**/a.cy.ts'],
    });
  });
  it('does not split the spec glob even if it contains spaces', () => {
    const { args } = buildCommand('npx cypress run --spec {spec}', 'a b.cy.ts');
    expect(args[args.length - 1]).toBe('a b.cy.ts');
  });
});

describe('parseRunnerArgs', () => {
  it('parses space-separated flags', () => {
    expect(parseRunnerArgs(['--port', '9000', '--command', 'yarn cy {spec}', '--cwd', '/p', '--host', '0.0.0.0']))
      .toEqual({ port: 9000, command: 'yarn cy {spec}', cwd: '/p', host: '0.0.0.0' });
  });
  it('parses = forms', () => {
    expect(parseRunnerArgs(['--port=9001', '--cwd=/x'])).toEqual({ port: 9001, cwd: '/x' });
  });
  it('returns empty options for no args', () => {
    expect(parseRunnerArgs([])).toEqual({});
  });
});

// ── runSpec ─────────────────────────────────────────────────────────────────

describe('runSpec', () => {
  it('resolves success when the process exits 0', async () => {
    const r = await runSpec('a.cy.ts', {}, fakeSpawn({ code: 0, out: 'All passed' }));
    expect(r.success).toBe(true);
    expect(r.exitCode).toBe(0);
    expect(r.output).toContain('All passed');
  });
  it('resolves failure when the process exits non-zero', async () => {
    const r = await runSpec('a.cy.ts', {}, fakeSpawn({ code: 1, out: '1 failing' }));
    expect(r.success).toBe(false);
    expect(r.exitCode).toBe(1);
  });
  it('resolves an error result when the process errors', async () => {
    const r = await runSpec('a.cy.ts', {}, fakeSpawn({ errorEvent: true }));
    expect(r.success).toBe(false);
    expect(r.output).toContain('spawn failed');
  });
  it('does not spawn and returns a message when no spec is given', async () => {
    let spawned = false;
    const spy = ((..._a: unknown[]) => { spawned = true; return new EventEmitter(); }) as unknown as typeof spawn;
    const r = await runSpec('', {}, spy);
    expect(spawned).toBe(false);
    expect(r.success).toBe(false);
    expect(r.output).toBe('No spec provided');
  });
});

// ── HTTP server ───────────────────────────────────────────────────────────────

describe('createRunnerServer', () => {
  it('answers OPTIONS preflight with CORS headers (not wildcard)', async () => {
    const server = createRunnerServer({}, fakeSpawn({ code: 0 }));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    const res = await httpRequest(port, 'OPTIONS', '/run-test');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(DEFAULT_ALLOW_ORIGIN);
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
    server.close();
  });

  it('runs the spec on POST /run-test and returns the JSON result', async () => {
    const server = createRunnerServer({}, fakeSpawn({ code: 0, out: 'green' }));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    const res = await httpRequest(port, 'POST', '/run-test', JSON.stringify({ specPath: 'a.cy.ts' }));
    expect(res.status).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed).toMatchObject({ success: true, exitCode: 0 });
    expect(parsed.output).toContain('green');
    server.close();
  });

  it('returns 404 for other routes', async () => {
    const server = createRunnerServer({}, fakeSpawn({ code: 0 }));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    const res = await httpRequest(port, 'GET', '/nope');
    expect(res.status).toBe(404);
    server.close();
  });
});

// ── AC-02 — CORS origin restriction ──────────────────────────────────────────

describe('resolveAllowedOrigin', () => {
  it('returns the configured origin when no Origin header is sent', () => {
    expect(resolveAllowedOrigin(undefined, 'http://localhost')).toBe('http://localhost');
  });

  it('reflects localhost with any port', () => {
    expect(resolveAllowedOrigin('http://localhost:3000', 'http://localhost')).toBe('http://localhost:3000');
  });

  it('reflects 127.0.0.1 with any port', () => {
    expect(resolveAllowedOrigin('http://127.0.0.1:5000', 'http://localhost')).toBe('http://127.0.0.1:5000');
  });

  it('reflects localhost without explicit port', () => {
    expect(resolveAllowedOrigin('http://localhost', 'http://localhost')).toBe('http://localhost');
  });

  it('returns configured origin for an unknown external origin', () => {
    expect(resolveAllowedOrigin('http://evil.com', 'http://localhost')).toBe('http://localhost');
  });

  it('reflects a custom allowOrigin when it exactly matches the request', () => {
    expect(resolveAllowedOrigin('http://myapp.test', 'http://myapp.test')).toBe('http://myapp.test');
  });

  it('returns configured origin when external origin does not match', () => {
    expect(resolveAllowedOrigin('http://other.test', 'http://myapp.test')).toBe('http://myapp.test');
  });
});

describe('parseRunnerArgs — AC-02 --allow-origin', () => {
  it('parses --allow-origin space form', () => {
    expect(parseRunnerArgs(['--allow-origin', 'http://myapp.test'])).toMatchObject({ allowOrigin: 'http://myapp.test' });
  });

  it('parses --allow-origin= equals form', () => {
    expect(parseRunnerArgs(['--allow-origin=http://myapp.test'])).toMatchObject({ allowOrigin: 'http://myapp.test' });
  });

  it('existing flags still parse alongside --allow-origin', () => {
    const opts = parseRunnerArgs(['--port', '9000', '--allow-origin', 'http://dev.local']);
    expect(opts).toMatchObject({ port: 9000, allowOrigin: 'http://dev.local' });
  });
});

describe('createRunnerServer — AC-02 CORS origin restriction', () => {
  it('does not reflect unknown origin (not *)', async () => {
    const server = createRunnerServer({}, fakeSpawn({ code: 0 }));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    const res = await httpRequest(port, 'OPTIONS', '/run-test', undefined, { origin: 'http://evil.com' });
    expect(res.headers['access-control-allow-origin']).not.toBe('http://evil.com');
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
    server.close();
  });

  it('reflects localhost:PORT origin', async () => {
    const server = createRunnerServer({}, fakeSpawn({ code: 0 }));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    const res = await httpRequest(port, 'OPTIONS', '/run-test', undefined, { origin: 'http://localhost:3000' });
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    server.close();
  });

  it('reflects 127.0.0.1:PORT origin', async () => {
    const server = createRunnerServer({}, fakeSpawn({ code: 0 }));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    const res = await httpRequest(port, 'OPTIONS', '/run-test', undefined, { origin: 'http://127.0.0.1:5000' });
    expect(res.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5000');
    server.close();
  });

  it('reflects a custom allowOrigin when request matches', async () => {
    const server = createRunnerServer({ allowOrigin: 'http://myapp.test' }, fakeSpawn({ code: 0 }));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    const res = await httpRequest(port, 'OPTIONS', '/run-test', undefined, { origin: 'http://myapp.test' });
    expect(res.headers['access-control-allow-origin']).toBe('http://myapp.test');
    server.close();
  });

  it('POST /run-test also sends the restricted CORS header', async () => {
    const server = createRunnerServer({}, fakeSpawn({ code: 0, out: 'ok' }));
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as AddressInfo).port;
    const res = await httpRequest(port, 'POST', '/run-test', JSON.stringify({ specPath: 'a.cy.ts' }), { origin: 'http://localhost:4200' });
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
    server.close();
  });
});

describe('startRunner', () => {
  it('starts listening and can be closed', async () => {
    const server = startRunner({ port: 0 });
    await new Promise<void>((resolve) => {
      if (server.listening) resolve();
      else server.on('listening', () => resolve());
    });
    expect(server.listening).toBe(true);
    await new Promise<void>((r) => server.close(() => r()));
  });
});
