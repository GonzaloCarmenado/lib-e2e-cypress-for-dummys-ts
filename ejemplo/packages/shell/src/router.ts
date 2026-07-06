type MountFn = (el: HTMLElement) => void;
type UnmountFn = (el: HTMLElement) => void;

interface RemoteModule { mount: MountFn; unmount: UnmountFn }

let currentUnmount: UnmountFn | null = null;
let currentRecorder: HTMLElement | null = null;

const slot = () => document.getElementById('remote-slot')!;

function updateNav(path: string) {
  document.querySelectorAll('nav [data-route]').forEach(a => {
    const route = a.getAttribute('data-route')!;
    const active = path === route || (route !== '/' && path.startsWith(route));
    a.classList.toggle('active', active);
  });
}

async function loadRemote(path: string, recorderMode: string) {
  // Unmount previous remote
  if (currentUnmount) {
    currentUnmount(slot());
    currentUnmount = null;
  }
  // Option B: remove previous MFE recorder
  if (recorderMode === 'mfe' && currentRecorder) {
    currentRecorder.remove();
    currentRecorder = null;
  }

  slot().innerHTML = '<div style="padding:40px;text-align:center;color:#484f58">Cargando…</div>';
  updateNav(path);

  try {
    let mod: RemoteModule;
    const unwrap = (m: unknown): RemoteModule => {
      const raw = m as Record<string, unknown>;
      return (raw['default'] && typeof (raw['default'] as RemoteModule).mount === 'function'
        ? raw['default']
        : raw) as RemoteModule;
    };
    if (path.startsWith('/store')) {
      mod = unwrap(await import('store/mount'));
    } else if (path.startsWith('/forms')) {
      mod = unwrap(await import('forms/mount'));
    } else if (path.startsWith('/admin')) {
      mod = unwrap(await import('admin/mount'));
    } else if (path === '/guide') {
      const { mountGuide } = await import('./pages/guide.js');
      mountGuide(slot());
      updateNav(path);
      return;
    } else {
      mountHome(slot());
      updateNav(path);
      return;
    }

    slot().innerHTML = '';

    // Option B: mount a recorder inside the remote slot before mounting the app
    if (recorderMode === 'mfe') {
      currentRecorder = document.createElement('lib-e2e-recorder');
      slot().appendChild(currentRecorder);
    }

    mod.mount(slot());
    currentUnmount = mod.unmount;
  } catch (e) {
    slot().innerHTML = `
      <div style="padding:40px;color:#f85149;font-family:monospace;font-size:13px">
        <b>Error cargando remote</b><br><br>
        ${String(e)}<br><br>
        <small style="color:#484f58">Asegúrate de que los remotes están corriendo
        (npm run dev desde ejemplo/)</small>
      </div>`;
  }
}

function mountHome(el: HTMLElement) {
  el.innerHTML = `
    <div class="page">
      <p class="page-title">lib-e2e-cypress-for-dummys — showcase</p>
      <p class="page-sub">Ejemplo de integración en microfrontends (Module Federation + Vite + Web Components).</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
        <a href="/store" data-route="/store" class="nav-card">
          <div style="font-size:24px">🛒</div>
          <b>Tienda</b>
          <small>Clicks, selectores, HTTP GET, fixtures</small>
        </a>
        <a href="/forms" data-route="/forms" class="nav-card">
          <div style="font-size:24px">📋</div>
          <b>Checkout</b>
          <small>Formularios, HTTP POST/PUT, Alt+click</small>
        </a>
        <a href="/admin" data-route="/admin" class="nav-card">
          <div style="font-size:24px">⚙️</div>
          <b>Panel</b>
          <small>Sub-rutas, tablas, IDs de framework</small>
        </a>
        <a href="/guide" data-route="/guide" class="nav-card">
          <div style="font-size:24px">📖</div>
          <b>Guía</b>
          <small>Todas las features y cómo activarlas</small>
        </a>
      </div>
      <div class="card" style="font-size:12px;color:#8b949e;line-height:1.8">
        <b style="color:#e6edf3">Modo actual del recorder:</b>
        <code id="mode-display"></code><br>
        Cambia con <code>?recorder=shell</code> (Opción A, recomendada) o
        <code>?recorder=mfe</code> (Opción B — un recorder por MFE).
      </div>
    </div>
    <style>
      .nav-card {
        display:flex;flex-direction:column;gap:4px;
        background:#161b22;border:1px solid #30363d;border-radius:10px;
        padding:20px;cursor:pointer;text-decoration:none;color:#e6edf3;
        transition:border-color .12s,background .12s;
      }
      .nav-card:hover { border-color:#2f81f7; background:#1c2128; }
      .nav-card b { font-size:15px; }
      .nav-card small { color:#8b949e; font-size:12px; }
    </style>`;
  const modeEl = el.querySelector<HTMLElement>('#mode-display');
  if (modeEl) modeEl.textContent = new URLSearchParams(location.search).get('recorder') ?? 'shell';

  // Nav cards using History API
  el.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigate(a.getAttribute('data-route')!);
    });
  });
}

function navigate(path: string) {
  history.pushState({}, '', path);
  loadRemote(path, (window as unknown as { _recorderMode: string })._recorderMode ?? 'shell');
}

export function initRouter(recorderMode: string) {
  (window as unknown as { _recorderMode: string })._recorderMode = recorderMode;

  // Intercept nav link clicks
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('nav [data-route]');
    if (!a) return;
    e.preventDefault();
    navigate(a.getAttribute('data-route')!);
  });

  // Back/Forward
  window.addEventListener('popstate', () => {
    loadRemote(location.pathname, recorderMode);
  });

  // Initial load
  loadRemote(location.pathname, recorderMode);
}
