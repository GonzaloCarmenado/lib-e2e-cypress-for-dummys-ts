export function mountGuide(el: HTMLElement) {
  el.innerHTML = `
  <div class="page">
    <p class="page-title">📖 Guía de features</p>
    <p class="page-sub">
      Tabla de todas las capacidades de <code>lib-e2e-cypress-for-dummys</code>:
      cómo activarlas, en qué app probarlas y qué comando Cypress generan.
    </p>

    <h2 style="margin-bottom:12px">⌨️ Atajos de teclado</h2>
    <table style="margin-bottom:28px">
      <tr><th>Atajo</th><th>Acción</th><th>Requiere</th></tr>
      <tr><td><kbd>Ctrl+Shift+E</kbd></td><td>Mostrar / ocultar widget</td><td>Siempre activo</td></tr>
      <tr><td><kbd>Ctrl+R</kbd></td><td>Iniciar / parar grabación</td><td>Widget visible</td></tr>
      <tr><td><kbd>Ctrl+P</kbd></td><td>Pausar / reanudar grabación</td><td>Grabando</td></tr>
      <tr><td><kbd>Ctrl+1</kbd></td><td>Panel Tests guardados</td><td>Widget visible</td></tr>
      <tr><td><kbd>Ctrl+2</kbd></td><td>Panel Comandos (preview)</td><td>Widget visible</td></tr>
      <tr><td><kbd>Ctrl+3</kbd></td><td>Panel Configuración</td><td>Widget visible</td></tr>
      <tr><td><kbd>Ctrl+Shift+H</kbd></td><td>Panel de Ayuda</td><td>Widget visible</td></tr>
      <tr><td><kbd>Alt+click</kbd></td><td>Capturar aserción</td><td>Grabando</td></tr>
    </table>

    <h2 style="margin-bottom:12px">🗺️ Features por app</h2>
    <table style="margin-bottom:28px">
      <tr><th>Feature</th><th>App</th><th>Cómo activar</th><th>Comando generado</th></tr>
      <tr><td>Click</td><td>🛒 Tienda</td><td>Click en cualquier botón con selector</td><td><code>cy.get('[data-cy="btn"]').click()</code></td></tr>
      <tr><td>Double-click</td><td>🛒 Tienda</td><td>Doble clic rápido</td><td><code>.dblclick()</code></td></tr>
      <tr><td>Right-click</td><td>🛒 Tienda</td><td>Botón derecho</td><td><code>.rightclick()</code></td></tr>
      <tr><td>Select</td><td>🛒 Tienda</td><td>Cambiar un &lt;select&gt;</td><td><code>.select('valor')</code></td></tr>
      <tr><td>Input text</td><td>📋 Checkout</td><td>Escribir en campo de texto (espera 1s)</td><td><code>.clear().type('...')</code></td></tr>
      <tr><td>Enter / Escape</td><td>📋 Checkout</td><td>Pulsar Enter o Esc dentro de un campo</td><td><code>.type('{'{enter}'}')</code></td></tr>
      <tr><td>Checkbox</td><td>📋 Checkout</td><td>Marcar / desmarcar checkbox</td><td><code>.check() / .uncheck()</code></td></tr>
      <tr><td>Radio</td><td>📋 Checkout</td><td>Seleccionar radio button</td><td><code>.check()</code></td></tr>
      <tr><td>Alt+click aserción</td><td>📋 Checkout</td><td>Mantener Alt y hacer clic</td><td><code>.should('be.visible')</code> / etc.</td></tr>
      <tr><td>Ruta SPA</td><td>Shell</td><td>Navegar entre apps con los links del nav</td><td><code>cy.url().should('include', '/store')</code></td></tr>
      <tr><td>Sub-ruta interna</td><td>⚙️ Panel</td><td>Navegar a Usuarios / Config dentro del panel</td><td><code>cy.url().should('include', '/admin/users')</code></td></tr>
      <tr><td>HTTP GET spy</td><td>🛒 Tienda</td><td>Grabar con HTTP monitor activo; GET dispara al cargar</td><td><code>cy.intercept('GET','**/api/products').as('...')</code></td></tr>
      <tr><td>HTTP GET fixtures</td><td>🛒 Tienda</td><td>Activar toggle "Fixtures HTTP" en Config; "Guardar y editar"</td><td><code>cy.intercept('GET','...', {'{fixture}'}).as('...')</code></td></tr>
      <tr><td>HTTP POST/PUT body</td><td>📋 Checkout</td><td>Activar "Validaciones de body"; enviar formulario</td><td><code>cy.wait('@alias').then(icp =&gt; expect(...))</code></td></tr>
      <tr><td>HTTP DELETE ignorado</td><td>📋 Checkout</td><td>Pulsar botón "Eliminar pedido" — NO debe aparecer interceptor</td><td>(sin comando)</td></tr>
      <tr><td>Selector data-cy</td><td>🛒 Tienda §1</td><td>Estrategia "data-cy" en Config (defecto)</td><td><code>[data-cy="..."]</code></td></tr>
      <tr><td>Selector data-testid</td><td>🛒 Tienda §2</td><td>Cambiar estrategia a "data-testid"</td><td><code>[data-testid="..."]</code></td></tr>
      <tr><td>Selector aria-label</td><td>🛒 Tienda §3</td><td>Cambiar estrategia a "aria-label"</td><td><code>[aria-label="..."]</code></td></tr>
      <tr><td>Selector id</td><td>🛒 Tienda §4</td><td>Cambiar estrategia a "id"</td><td><code>#btn-id</code></td></tr>
      <tr><td>IDs prefijo framework</td><td>⚙️ Panel</td><td>Click en elemento con id cdk-xxx/mat-xxx — debe ignorarse</td><td>(sin selector de ID framework)</td></tr>
      <tr><td>Smart Selector Picker</td><td>🛒 Tienda §5</td><td>Click en elemento SIN atributo de test</td><td>Overlay con ancestros coloreados</td></tr>
      <tr><td>Builder de aserciones</td><td>Panel Comandos</td><td>Abrir Ctrl+2 → formulario inferior</td><td><code>cy.get('...').should('...')</code></td></tr>
      <tr><td>Continuidad cross-app</td><td>Shell + remotes</td><td>Grabar en Tienda → navegar a Checkout → seguir grabando</td><td>Comandos de ambas apps en un solo test</td></tr>
      <tr><td>Opción A vs B (spec 006)</td><td>Shell</td><td><code>?recorder=shell</code> vs <code>?recorder=mfe</code></td><td>Ver tabla inferior</td></tr>
      <tr><td>Import / Export tests</td><td>Config ⚙️</td><td>Ctrl+3 → sección Datos</td><td>Archivo JSON</td></tr>
      <tr><td>Ticket / Issue tracker</td><td>Config ⚙️</td><td>Ctrl+3 → sección Issue tracker</td><td><code>// Ticket: PROJ-123</code></td></tr>
      <tr><td>Historial grabaciones</td><td>API JS</td><td><code>recorder.recoverLastRecording()</code></td><td>Restaura last-5 del localStorage</td></tr>
      <tr><td>Idioma</td><td>Config ⚙️</td><td>Ctrl+3 → selector de idioma</td><td>UI en es/en/fr/it/de</td></tr>
    </table>

    <h2 style="margin-bottom:12px">🔀 Opción A vs Opción B (spec 006)</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
      <div class="card">
        <b style="color:#3fb950">✓ Opción A — recorder en el shell (recomendada)</b>
        <p style="font-size:12px;color:#8b949e;margin-top:8px;line-height:1.7">
          Un único <code>&lt;lib-e2e-recorder&gt;</code> montado en el shell, nunca se desmonta.
          La grabación sobrevive a todos los cruces de MFE de forma natural.
          <br><br>Activa con <code>?recorder=shell</code> (defecto).
        </p>
      </div>
      <div class="card">
        <b style="color:#d29922">⚠ Opción B — recorder por MFE</b>
        <p style="font-size:12px;color:#8b949e;margin-top:8px;line-height:1.7">
          Cada remote monta su propio recorder. La continuidad la proporciona la sesión
          persistida en IndexedDB. <b>Caveat:</b> durante la transición single-spa dos apps
          pueden estar montadas a la vez → posible <code>cy.wait</code> duplicado; bórralo a mano
          o usa la Opción A.
          <br><br>Activa con <code>?recorder=mfe</code>.
        </p>
      </div>
    </div>

    <h2 style="margin-bottom:12px">🗂️ File panel + fixtures + runner</h2>
    <div class="card" style="font-size:13px;color:#8b949e;line-height:1.8">
      <ol style="margin-left:16px">
        <li>Configura la carpeta Cypress: <kbd>Ctrl+3</kbd> → "Carpeta Cypress" → selecciona
            <code>ejemplo/cypress/</code></li>
        <li>Graba y guarda un test con "Guardar y editar" → se abre el editor de archivos.</li>
        <li>Inserta el bloque <code>it()</code> en <code>showcase.cy.ts</code>.</li>
        <li>Para las fixtures: activa "🧪 Fixtures HTTP" en Config → graba un test con
            llamadas GET → "Guardar y editar" → los <code>.json</code> se escriben en
            <code>ejemplo/cypress/fixtures/</code>.</li>
        <li>Para lanzar el test: ejecuta <code>npx lib-e2e-cypress-runner</code> desde
            <code>ejemplo/</code>, luego pulsa <b>▶ Lanzar test</b> en el editor.</li>
      </ol>
    </div>
  </div>`;
}
