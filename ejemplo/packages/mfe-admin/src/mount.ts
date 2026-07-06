import '../../shared/src/styles.css';
import '../../shared/src/feature-card.js';

export function mount(el: HTMLElement): void {
  render(el, '/admin');
}

export function unmount(el: HTMLElement): void {
  el.innerHTML = '';
}

function renderUsers(el: HTMLElement): void {
  el.innerHTML = `
  <div class="page">
    <p class="page-title">⚙️ Panel Admin — Usuarios</p>

    <!-- §1 Sub-rutas internas -->
    <feature-card
      name="§1 — Navegación interna (sub-rutas)"
      how="Grabar activo|Hacer clic en los tabs de abajo"
      expected="cy.url().should('include', '/admin/users')&#10;cy.url().should('include', '/admin/config')">
      <div class="row" style="margin-bottom:4px">
        <button data-cy="tab-users" class="tab-btn active" onclick="window._adminNav('/admin/users')">Usuarios</button>
        <button data-cy="tab-config" class="tab-btn" onclick="window._adminNav('/admin/config')">Configuración</button>
      </div>
    </feature-card>

    <!-- §2 Tabla con dblclick / rightclick -->
    <feature-card
      name="§2 — Tabla: dblclick / rightclick"
      how="Grabar activo|Doble clic en una fila para editar|Botón derecho para el menú contextual"
      expected="cy.get('[data-cy=\\"row-user-1\\"]').dblclick()&#10;cy.get('[data-cy=\\"row-user-2\\"]').rightclick()">
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>Rol</th><th>Estado</th></tr></thead>
        <tbody>
          <tr data-cy="row-user-1" style="cursor:pointer"><td>001</td><td>Ana García</td><td>Admin</td><td><span class="badge badge-green">Activa</span></td></tr>
          <tr data-cy="row-user-2" style="cursor:pointer"><td>002</td><td>Carlos López</td><td>Editor</td><td><span class="badge badge-green">Activo</span></td></tr>
          <tr data-cy="row-user-3" style="cursor:pointer"><td>003</td><td>María Ruiz</td><td>Viewer</td><td><span class="badge badge-amber">Inactiva</span></td></tr>
        </tbody>
      </table>
    </feature-card>

    <!-- §3 IDs con prefijo de framework -->
    <feature-card
      name="§3 — IDs con prefijo de framework (ignorados)"
      how="Estrategia 'id' en Config|Click en los botones — mat-/cdk- NO generan selector de ID"
      expected="cy.get('#admin-save').click()   ← id limpio&#10;(sin selector para mat-button-0, cdk-step-1)">
      <div class="row">
        <button id="admin-save" data-cy="btn-admin-save">id="admin-save" ✓</button>
        <button id="mat-button-0">id="mat-button-0" ✗</button>
        <button id="cdk-step-1">id="cdk-step-1" ✗</button>
      </div>
    </feature-card>

    <!-- §4 mat-select simulado -->
    <feature-card
      name="§4 — Elemento mat-select-like (overlay)"
      how="Grabar activo|Click en el select personalizado|Seleccionar una opción del dropdown"
      expected="cy.get('[data-cy=\\"mat-like-select\\"]').click()&#10;cy.get('[data-cy=\\"opt-editor\\"]').click()">
      <div style="position:relative;display:inline-block">
        <div data-cy="mat-like-select" id="mat-like-trigger"
          style="padding:8px 14px;background:#21262d;border:1px solid #30363d;border-radius:6px;cursor:pointer;min-width:160px;user-select:none"
          onclick="window._adminToggleSelect()">
          <span id="mat-like-value">Rol: Todos</span> ▾
        </div>
        <div id="mat-like-dropdown"
          style="display:none;position:absolute;top:100%;left:0;background:#161b22;border:1px solid #30363d;border-radius:6px;z-index:10;min-width:160px">
          <div data-cy="opt-all" style="padding:8px 14px;cursor:pointer" onclick="window._adminSelectOpt('Todos')">Todos</div>
          <div data-cy="opt-admin" style="padding:8px 14px;cursor:pointer" onclick="window._adminSelectOpt('Admin')">Admin</div>
          <div data-cy="opt-editor" style="padding:8px 14px;cursor:pointer" onclick="window._adminSelectOpt('Editor')">Editor</div>
          <div data-cy="opt-viewer" style="padding:8px 14px;cursor:pointer" onclick="window._adminSelectOpt('Viewer')">Viewer</div>
        </div>
      </div>
    </feature-card>

    <!-- §5 HTTP GET users -->
    <feature-card
      name="§5 — HTTP GET (cargar usuarios)"
      how="Grabar activo|Pulsar 'Cargar usuarios'"
      expected="cy.intercept('GET','**/api/users').as('get-api-users')&#10;cy.wait('@get-api-users')">
      <div class="col">
        <button data-cy="btn-load-users" onclick="window._adminLoadUsers()">Cargar usuarios (GET)</button>
        <div id="users-output" style="font-size:11px;color:#8b949e;font-family:monospace;min-height:18px;margin-top:4px"></div>
      </div>
    </feature-card>
  </div>
  <style>
    .tab-btn { background:#21262d;border:1px solid #30363d;border-radius:6px;color:#8b949e;cursor:pointer;padding:6px 16px }
    .tab-btn.active { background:#2f81f7;border-color:#2f81f7;color:#fff }
  </style>`;
}

function renderConfig(el: HTMLElement): void {
  el.innerHTML = `
  <div class="page">
    <p class="page-title">⚙️ Panel Admin — Configuración</p>
    <div class="row" style="margin-bottom:16px">
      <button data-cy="tab-users" class="tab-btn" onclick="window._adminNav('/admin/users')">Usuarios</button>
      <button data-cy="tab-config" class="tab-btn active" onclick="window._adminNav('/admin/config')">Configuración</button>
    </div>
    <div class="card">
      <p style="color:#8b949e;font-size:13px">Página de configuración del panel admin.<br>
      Navega aquí desde la pestaña "Usuarios" para ejercitar <code>cy.url().should('include', '/admin/config')</code>.</p>
      <button data-cy="btn-reset-config" style="margin-top:12px">Restablecer configuración</button>
    </div>
  </div>
  <style>
    .tab-btn { background:#21262d;border:1px solid #30363d;border-radius:6px;color:#8b949e;cursor:pointer;padding:6px 16px }
    .tab-btn.active { background:#2f81f7;border-color:#2f81f7;color:#fff }
  </style>`;
}

function render(el: HTMLElement, path: string): void {
  if (path === '/admin/config') {
    renderConfig(el);
  } else {
    renderUsers(el);
  }

  (window as unknown as Record<string, unknown>)._adminNav = (newPath: string) => {
    history.pushState({}, '', newPath);
    render(el, newPath);
  };

  (window as unknown as Record<string, unknown>)._adminToggleSelect = () => {
    const dd = document.getElementById('mat-like-dropdown');
    if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  };

  (window as unknown as Record<string, unknown>)._adminSelectOpt = (val: string) => {
    const v = document.getElementById('mat-like-value');
    if (v) v.textContent = `Rol: ${val}`;
    const dd = document.getElementById('mat-like-dropdown');
    if (dd) dd.style.display = 'none';
  };

  (window as unknown as Record<string, unknown>)._adminLoadUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json() as { users: Array<{ id: number; name: string }> };
    const out = el.querySelector<HTMLElement>('#users-output');
    if (out) out.textContent = `GET /api/users → ${res.status} (${data.users.length} usuarios)`;
  };
}
