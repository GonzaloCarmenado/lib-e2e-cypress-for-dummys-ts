import '../../shared/src/styles.css';
import '../../shared/src/feature-card.js';

let _root: HTMLElement | null = null;

export function mount(el: HTMLElement): void {
  _root = el;
  render(el);
}

export function unmount(el: HTMLElement): void {
  el.innerHTML = '';
  _root = null;
}

async function loadProducts(): Promise<void> {
  const res = await fetch('/api/products');
  const data = await res.json() as { products: Array<{ id: number; name: string; price: number; stock: number; category: string }> };
  const list = _root?.querySelector<HTMLElement>('#product-list');
  if (!list) return;
  list.innerHTML = data.products.map(p => `
    <tr>
      <td data-cy="product-name-${p.id}">${p.name}</td>
      <td>${p.category}</td>
      <td>${p.price.toFixed(2)} €</td>
      <td><span class="badge ${p.stock > 10 ? 'badge-green' : 'badge-amber'}">${p.stock}</span></td>
      <td>
        <button data-cy="btn-detail-${p.id}" style="padding:4px 10px;font-size:11px"
          onclick="window._storeDetail(${p.id})">Ver detalle</button>
      </td>
    </tr>`).join('');
  (window as unknown as Record<string, unknown>)._storeDetail = async (id: number) => {
    const r = await fetch(`/api/products/${id}`);
    const product = await r.json() as { id: number; name: string; price: number };
    const detail = _root?.querySelector<HTMLElement>('#detail-output');
    if (detail) detail.textContent = `GET /api/products/${id} → ${JSON.stringify(product)}`;
  };
}

function render(el: HTMLElement): void {
  el.innerHTML = `
  <div class="page">
    <p class="page-title">🛒 Tienda</p>
    <p class="page-sub">Ejercita <b>interacciones</b>, <b>estrategias de selector</b>, <b>HTTP GET</b> y el <b>Smart Selector Picker</b>.</p>

    <!-- §1 data-cy -->
    <feature-card
      name="§1 — Selector: data-cy (defecto)"
      how="Estrategia 'data-cy' en Config (Ctrl+3)|Click/dblclick/rightclick en los botones"
      expected="cy.get('[data-cy=\\"btn-click\\"]').click()">
      <div class="row">
        <button data-cy="btn-click">Click</button>
        <button data-cy="btn-dblclick" ondblclick="">Doble-click</button>
        <button data-cy="btn-rightclick">Right-click</button>
      </div>
    </feature-card>

    <!-- §2 data-testid -->
    <feature-card
      name="§2 — Selector: data-testid"
      how="Cambiar estrategia a 'data-testid' en Config|Click en el botón"
      expected="cy.get('[data-testid=\\"testid-btn\\"]').click()">
      <button data-testid="testid-btn">Botón con data-testid</button>
    </feature-card>

    <!-- §3 aria-label -->
    <feature-card
      name="§3 — Selector: aria-label"
      how="Cambiar estrategia a 'aria-label' en Config|Click en el botón"
      expected="cy.get('[aria-label=\\"Botón accesible\\"]').click()">
      <button aria-label="Botón accesible">Botón accesible (aria-label)</button>
    </feature-card>

    <!-- §4 id + framework-prefixed IDs -->
    <feature-card
      name="§4 — Selector: id limpio vs prefijos de framework"
      how="Cambiar estrategia a 'id' en Config|Click en cada botón|El id 'cdk-overlay-1' debe ignorarse (Smart Picker aparece)"
      expected="cy.get('#submit-order').click()  ← id limpio&#10;(sin selector para IDs con prefijo cdk-/mat-)">
      <div class="row">
        <button id="submit-order">id="submit-order" ✓</button>
        <button id="cdk-overlay-1">id="cdk-overlay-1" ✗ (framework)</button>
        <button id="mat-tab-0">id="mat-tab-0" ✗ (framework)</button>
      </div>
    </feature-card>

    <!-- §5 Sin selector → Smart Picker -->
    <feature-card
      name="§5 — Smart Selector Picker"
      how="Activar 'Smart selector' en Config (está ON por defecto)|Click en el botón de abajo (no tiene atributo de test ni id válido)"
      expected="El picker muestra la cadena de ancestros; selecciona uno con ↑↓ y Enter">
      <div style="padding:10px;background:#0d1117;border-radius:6px">
        <span><button style="background:#21262d;border:1px dashed #484f58">Sin selector (solo clases CSS)</button></span>
      </div>
    </feature-card>

    <!-- §6 Select -->
    <feature-card
      name="§6 — &lt;select&gt; dropdown"
      how="Grabar activo|Cambiar el valor del select"
      expected="cy.get('[data-cy=\\"category-filter\\"]').select('Monitores')">
      <div style="width:260px">
        <select data-cy="category-filter">
          <option value="">Todas las categorías</option>
          <option value="Periféricos">Periféricos</option>
          <option value="Monitores">Monitores</option>
          <option value="Almacenamiento">Almacenamiento</option>
        </select>
      </div>
    </feature-card>

    <!-- §7 Input + Enter/Escape -->
    <feature-card
      name="§7 — Input de texto + Enter/Escape"
      how="Grabar activo|Escribe en el campo (debounce 1s)|Pulsa Enter o Escape dentro del campo"
      expected="cy.get('[data-cy=\\"search-input\\"]').clear().type('teclado')&#10;cy.get('[data-cy=\\"search-input\\"]').type('{enter}')">
      <div class="col" style="width:280px">
        <input data-cy="search-input" type="text" placeholder="Buscar productos…" />
      </div>
    </feature-card>

    <!-- §8 HTTP GET -->
    <feature-card
      name="§8 — HTTP GET (spy / fixture)"
      how="Grabar activo|Pulsar 'Cargar productos' (dispara GET /api/products)|Para fixtures: activar '🧪 Fixtures HTTP' en Config antes de grabar; luego 'Guardar y editar'"
      expected="cy.intercept('GET','**/api/products').as('get-api-products')&#10;cy.wait('@get-api-products').then(icp => { })">
      <div class="col">
        <div class="row">
          <button data-cy="btn-load-products" onclick="_storeLoad()">Cargar productos (GET)</button>
          <button data-cy="btn-load-detail" onclick="_storeDetail(1)">Detalle producto 1 (GET id)</button>
        </div>
        <div id="detail-output" style="font-size:11px;color:#8b949e;font-family:monospace;min-height:18px"></div>
        <table>
          <thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
          <tbody id="product-list"><tr><td colspan="5" style="color:#484f58;font-size:12px">Pulsa "Cargar productos"</td></tr></tbody>
        </table>
      </div>
    </feature-card>
  </div>`;

  (window as unknown as Record<string, unknown>)._storeLoad = loadProducts;
}
