import { createServer, type Server } from 'node:http';
import { spawn } from 'node:child_process';

/**
 * Local Cypress runner — a tiny dev-only HTTP server that runs a single spec
 * headless on demand and returns the result. Shipped as the package `bin`
 * (`npx lib-e2e-cypress-runner`). Browser code never imports this file; it lives
 * in a separate Node-only build target. See docs/specs/005-launch-test-runner.md.
 */

export interface RunnerOptions {
  /** Command template; the `{spec}` token is replaced by the spec glob. */
  command?: string;
  /** Port to listen on (default 8123). */
  port?: number;
  /** Host to bind (default 127.0.0.1 — local only). */
  host?: string;
  /** Working directory the command runs in (default process.cwd()). */
  cwd?: string;
  /**
   * Allowed CORS origin. Any http://localhost:* or http://127.0.0.1:* origin
   * is always reflected back regardless of this setting.
   * Defaults to DEFAULT_ALLOW_ORIGIN ('http://localhost').
   * Can also be set via the RUNNER_ALLOW_ORIGIN env-var (CLI flag takes precedence).
   */
  allowOrigin?: string;
}

export interface RunResult {
  success: boolean;
  exitCode: number;
  output: string;
}

export const DEFAULT_COMMAND = 'npx cypress run --spec {spec}';
export const DEFAULT_PORT = 8123;
export const DEFAULT_HOST = '127.0.0.1';
export const DEFAULT_ALLOW_ORIGIN = 'http://localhost';

const LOCALHOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Resolves the Access-Control-Allow-Origin value for a given request.
 * Any http://localhost:* or http://127.0.0.1:* origin is reflected back
 * directly (dev apps run on arbitrary ports). An explicitly configured
 * origin is reflected when it matches exactly. All other origins receive
 * the configured origin (browser blocks cross-origin requests that don't
 * match, no wildcard is ever sent).
 */
export function resolveAllowedOrigin(
  requestOrigin: string | undefined,
  configuredOrigin: string,
): string {
  if (!requestOrigin) return configuredOrigin;
  if (LOCALHOST_PATTERN.test(requestOrigin)) return requestOrigin;
  if (requestOrigin === configuredOrigin) return requestOrigin;
  return configuredOrigin;
}

/**
 * Turns a spec name or path into a `--spec` glob. A bare file name is matched
 * recursively (prefixed with a leading globstar) so nested specs still match;
 * a value that already contains a slash is used as-is.
 */
export function toSpecGlob(specPath: string): string {
  const clean = (specPath ?? '').trim();
  if (!clean) return '';
  return clean.includes('/') ? clean : `**/${clean}`;
}

/** On Windows, node bin shims need the `.cmd` extension when spawned without a shell. */
export function resolveExecutable(cmd: string, platform: string = process.platform): string {
  return platform === 'win32' && /^(npx|npm|yarn|pnpm)$/.test(cmd) ? `${cmd}.cmd` : cmd;
}

/**
 * Splits a command template into `{ cmd, args }`, substituting `{spec}` with the
 * spec glob as a single argv element — never interpolated into a shell, so the
 * spec value cannot inject commands.
 */
export function buildCommand(template: string, specGlob: string): { cmd: string; args: string[] } {
  const parts = template.trim().split(/\s+/).filter(Boolean);
  const substituted = parts.map((p) => (p === '{spec}' ? specGlob : p));
  const [cmd, ...args] = substituted;
  return { cmd: cmd ?? '', args };
}

/** Runs the spec via the configured command and resolves with its result. Never rejects. */
export function runSpec(
  specPath: string,
  opts: RunnerOptions = {},
  spawnFn: typeof spawn = spawn,
): Promise<RunResult> {
  return new Promise((resolve) => {
    const glob = toSpecGlob(specPath);
    if (!glob) {
      resolve({ success: false, exitCode: 1, output: 'No spec provided' });
      return;
    }
    const built = buildCommand(opts.command ?? DEFAULT_COMMAND, glob);
    const exe = resolveExecutable(built.cmd);
    const child = spawnFn(exe, built.args, { cwd: opts.cwd ?? process.cwd(), shell: false });

    let output = '';
    child.stdout?.on('data', (d: unknown) => { output += String(d); });
    child.stderr?.on('data', (d: unknown) => { output += String(d); });
    child.on('error', (e: unknown) => {
      resolve({ success: false, exitCode: -1, output: `${output}\n${String(e)}` });
    });
    child.on('close', (code: number | null) => {
      resolve({ success: code === 0, exitCode: code ?? -1, output });
    });
  });
}

/** Creates the runner HTTP server (does not listen). Injectable spawn for testing. */
export function createRunnerServer(opts: RunnerOptions = {}, spawnFn: typeof spawn = spawn): Server {
  const configuredOrigin = opts.allowOrigin ?? DEFAULT_ALLOW_ORIGIN;
  return createServer((req, res) => {
    const corsOrigin = resolveAllowedOrigin(req.headers['origin'], configuredOrigin);
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'POST' || !req.url || !req.url.endsWith('/run-test')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: unknown) => { body += String(chunk); });
    req.on('end', () => {
      let specPath = '';
      try { specPath = (JSON.parse(body) as { specPath?: string }).specPath ?? ''; } catch { /* invalid JSON → empty */ }
      runSpec(specPath, opts, spawnFn).then((result) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      });
    });
  });
}

/** Parses CLI flags (`--port`, `--command`, `--cwd`, `--host`, `--allow-origin`, with `=` form too). */
export function parseRunnerArgs(argv: string[]): RunnerOptions {
  const opts: RunnerOptions = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') opts.port = Number(argv[++i]);
    else if (a === '--command') opts.command = argv[++i];
    else if (a === '--cwd') opts.cwd = argv[++i];
    else if (a === '--host') opts.host = argv[++i];
    else if (a === '--allow-origin') opts.allowOrigin = argv[++i];
    else if (a.startsWith('--port=')) opts.port = Number(a.slice('--port='.length));
    else if (a.startsWith('--command=')) opts.command = a.slice('--command='.length);
    else if (a.startsWith('--cwd=')) opts.cwd = a.slice('--cwd='.length);
    else if (a.startsWith('--host=')) opts.host = a.slice('--host='.length);
    else if (a.startsWith('--allow-origin=')) opts.allowOrigin = a.slice('--allow-origin='.length);
  }
  return opts;
}

/** Builds the server and starts listening. Returns the server. */
export function startRunner(opts: RunnerOptions = {}): Server {
  const port = opts.port ?? DEFAULT_PORT;
  const host = opts.host ?? DEFAULT_HOST;
  const mergedOpts: RunnerOptions = {
    ...opts,
    allowOrigin: opts.allowOrigin ?? process.env['RUNNER_ALLOW_ORIGIN'] ?? DEFAULT_ALLOW_ORIGIN,
  };
  const server = createRunnerServer(mergedOpts);
  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`[lib-e2e-cypress] runner listening on http://${host}:${port}  (command: ${opts.command ?? DEFAULT_COMMAND})`);
  });
  return server;
}
