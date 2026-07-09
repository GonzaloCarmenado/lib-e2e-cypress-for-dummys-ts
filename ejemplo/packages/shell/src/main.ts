import '../../shared/src/styles.css';
import '../../shared/src/feature-card.js';
import { setupWorker } from 'msw/browser';
import { handlers } from '../../shared/src/handlers.js';
import 'lib-e2e-cypress-for-dummys-ts';

// ── MSW mock API (intercepts at SW layer, compatible with lib's fetch patch) ──
const worker = setupWorker(...handlers);
await worker.start({ onUnhandledRequest: 'bypass' });

// ── Recorder placement via ?recorder= query param ──────────────────────────
const params = new URLSearchParams(location.search);
const recorderMode = params.get('recorder') ?? 'shell'; // 'shell' | 'mfe'

let recorderEl: HTMLElement | null = null;
if (recorderMode === 'shell') {
  recorderEl = document.createElement('lib-e2e-recorder');
  document.body.appendChild(recorderEl);
}

// ── App shell layout ────────────────────────────────────────────────────────
const app = document.querySelector<HTMLElement>('.app')!;
app.innerHTML = `
  <nav>
    <a href="/" data-route="/">🏠 Inicio</a>
    <a href="/store" data-route="/store">🛒 Tienda</a>
    <a href="/forms" data-route="/forms">📋 Checkout</a>
    <a href="/admin" data-route="/admin">⚙️ Panel</a>
    <a href="/guide" data-route="/guide">📖 Guía</a>
    <a href="/lab" data-route="/lab">🧪 Lab</a>
    <span class="recorder-badge"></span>
  </nav>
  <main class="shell-slot"></main>
  <style>
    nav {
      display: flex; align-items: center; gap: 4px;
      padding: 10px 20px;
      background: #161b22; border-bottom: 1px solid #21262d;
      font-size: 13px; font-family: -apple-system, sans-serif;
    }
    nav a {
      padding: 6px 12px; border-radius: 6px; color: #8b949e;
      text-decoration: none; transition: background .12s, color .12s;
    }
    nav a:hover, nav a.active { background: #21262d; color: #e6edf3; }
    .recorder-badge {
      margin-left: auto; font-size: 11px; color: #d29922;
      background: rgba(210,153,34,.12); border: 1px solid rgba(210,153,34,.3);
      padding: 2px 8px; border-radius: 12px;
    }
    main { min-height: calc(100vh - 48px); }
  </style>`;

document.querySelector<HTMLElement>('.recorder-badge')!.textContent =
  recorderMode === 'shell' ? '🎙 recorder: shell (Opción A)' : '🎙 recorder: mfe (Opción B)';

// ── Router ──────────────────────────────────────────────────────────────────
import { initRouter } from './router.js';
initRouter(recorderMode);
