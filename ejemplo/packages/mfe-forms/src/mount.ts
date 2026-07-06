import '../../shared/src/styles.css';
import { fc, injectFcStyles } from '../../shared/src/feature-card.js';

export function mount(el: HTMLElement): void {
  render(el);
}

export function unmount(el: HTMLElement): void {
  el.innerHTML = '';
}

function render(el: HTMLElement): void {
  injectFcStyles();

  el.innerHTML = `
  <div class="page">
    <p class="page-title">📋 Checkout</p>
    <p class="page-sub">Ejercita <b>formularios</b>, <b>HTTP POST/PUT/DELETE</b>, <b>Alt+click assertions</b> y <b>checkbox/radio</b>.</p>

    ${fc({ name: '§1 — Checkbox (.check / .uncheck)', how: 'Grabar activo|Marcar y desmarcar los checkboxes', expected: `cy.get('[data-cy="chk-terms"]').check()\ncy.get('[data-cy="chk-promo"]').uncheck()` }, `
      <div class="col">
        <label><input type="checkbox" data-cy="chk-terms" /> Acepto los términos y condiciones</label>
        <label><input type="checkbox" data-cy="chk-promo" checked /> Recibir promociones</label>
        <label><input type="checkbox" data-cy="chk-gift" /> Envoltorio de regalo</label>
      </div>
    `)}

    ${fc({ name: '§2 — Radio button (.check)', how: 'Grabar activo|Seleccionar una opción de envío', expected: `cy.get('[data-cy="radio-express"]').check()` }, `
      <div class="col">
        <label><input type="radio" name="delivery" data-cy="radio-standard" value="standard" /> Envío estándar (3–5 días)</label>
        <label><input type="radio" name="delivery" data-cy="radio-express" value="express" /> Express (24h)</label>
        <label><input type="radio" name="delivery" data-cy="radio-pickup" value="pickup" /> Recogida en tienda</label>
      </div>
    `)}

    ${fc({ name: '§3 — Textarea (.clear().type)', how: 'Grabar activo|Escribe en el área de texto (debounce 1s)', expected: `cy.get('[data-cy="textarea-notes"]').clear().type('Dejar en conserjería')` }, `
      <textarea data-cy="textarea-notes" rows="3" style="width:100%;max-width:360px"
        placeholder="Notas de entrega…"></textarea>
    `)}

    ${fc({ name: '§4 — HTTP POST (body validation)', how: "Activar 'Validaciones de body HTTP' en Config|Rellenar datos mínimos y pulsar 'Realizar pedido'", expected: `cy.intercept('POST','**/api/orders').as('post-api-orders')\ncy.wait('@post-api-orders').then(icp => {\n  expect(icp.request.body).to.include.keys('product','qty')\n})` }, `
      <div class="col" style="width:320px">
        <input data-cy="input-product" type="text" placeholder="Producto ID" style="margin-bottom:8px"/>
        <input data-cy="input-qty" type="number" placeholder="Cantidad" min="1" style="margin-bottom:8px"/>
        <button data-cy="btn-submit-order" onclick="window._formsPost()">Realizar pedido (POST)</button>
        <div id="post-output" style="font-size:11px;color:#8b949e;font-family:monospace;min-height:18px;margin-top:4px"></div>
      </div>
    `)}

    ${fc({ name: '§5 — HTTP PUT (modificar pedido)', how: "Activar 'Validaciones de body HTTP' en Config|Pulsar 'Modificar pedido'", expected: `cy.intercept('PUT','**/api/orders/*').as('put-api-orders')\ncy.wait('@put-api-orders')` }, `
      <div class="col" style="width:320px">
        <input data-cy="input-order-id" type="text" placeholder="Order ID (ej: 42)" style="margin-bottom:8px"/>
        <button data-cy="btn-update-order" onclick="window._formsPut()">Modificar pedido (PUT)</button>
        <div id="put-output" style="font-size:11px;color:#8b949e;font-family:monospace;min-height:18px;margin-top:4px"></div>
      </div>
    `)}

    ${fc({ name: '§6 — HTTP DELETE (debe ignorarse)', how: "Grabar activo|Pulsar 'Eliminar pedido'|El monitor NO debe generar cy.intercept para DELETE", expected: '(sin comando — DELETE está excluido del monitor HTTP)' }, `
      <button data-cy="btn-delete-order" onclick="window._formsDelete()">Eliminar pedido (DELETE)</button>
      <div id="delete-output" style="font-size:11px;color:#8b949e;font-family:monospace;min-height:18px;margin-top:4px"></div>
    `)}

    ${fc({ name: '§7 — Alt+click: captura de aserciones', how: 'Grabar activo|Mantener Alt y hacer clic en cualquier elemento de abajo', expected: `cy.get('[data-cy="assert-target"]').should('be.visible')\n(o la aserción que elijas en el picker)` }, `
      <div class="col">
        <div data-cy="assert-target"
          style="padding:14px 20px;background:#1f3347;border:1px solid #2f81f7;border-radius:8px;color:#58a6ff">
          Alt+click aquí para capturar una aserción
        </div>
        <div data-cy="assert-text" style="padding:8px 14px;background:#161b22;border-radius:6px;font-size:12px;color:#8b949e">
          Texto visible: <b style="color:#e6edf3">Precio total: 89,99 €</b>
        </div>
      </div>
    `)}
  </div>`;

  const postOut = el.querySelector<HTMLElement>('#post-output');
  const putOut = el.querySelector<HTMLElement>('#put-output');
  const delOut = el.querySelector<HTMLElement>('#delete-output');

  (window as unknown as Record<string, unknown>)._formsPost = async () => {
    const product = el.querySelector<HTMLInputElement>('[data-cy="input-product"]')?.value || 'prod-1';
    const qty = el.querySelector<HTMLInputElement>('[data-cy="input-qty"]')?.value || '1';
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, qty: Number(qty) }),
    });
    const data = await res.json() as { id: number; status: string; total: number };
    if (postOut) postOut.textContent = `POST /api/orders → ${res.status} ${JSON.stringify(data)}`;
  };

  (window as unknown as Record<string, unknown>)._formsPut = async () => {
    const orderId = el.querySelector<HTMLInputElement>('[data-cy="input-order-id"]')?.value || '42';
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'updated', total: 99.99 }),
    });
    const data = await res.json() as { id: number; status: string };
    if (putOut) putOut.textContent = `PUT /api/orders/${orderId} → ${res.status} ${JSON.stringify(data)}`;
  };

  (window as unknown as Record<string, unknown>)._formsDelete = async () => {
    const res = await fetch('/api/orders/42', { method: 'DELETE' });
    if (delOut) delOut.textContent = `DELETE /api/orders/42 → ${res.status} (no interceptor generado)`;
  };
}
