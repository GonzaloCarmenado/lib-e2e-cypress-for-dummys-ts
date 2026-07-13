export function mountLab(el: HTMLElement) {
  el.innerHTML = `
  <div class="page">
    <p class="page-title">🧪 Laboratorio de casos extremos</p>
    <p class="page-sub">
      Sección de uso interno del equipo de desarrollo de <code>lib-e2e-cypress-for-dummys</code>.
      Aquí se concentran los elementos más raros que pueden provocar que el widget genere comandos
      Cypress sintácticamente incorrectos. Si tu equipo trabaja con datos habituales
      (nombres sin apóstrofes, APIs con claves camelCase, selectores sin comillas especiales),
      es muy probable que <b>nunca encuentres ninguno de estos casos</b>.
    </p>
    <div class="lab-warn">
      ⚠️&nbsp; Esta sección existe para verificar manualmente que los escapes de seguridad
      funcionan correctamente tras cada cambio en <code>recording.service.ts</code> o
      <code>http-monitor.ts</code>. Los elementos de cada sección son deliberadamente raros —
      su propósito es demostrar el problema, no ilustrar buenas prácticas.
    </div>

    <!-- ── Caso A ── -->
    <h2 class="lab-h2">Caso A — Comillas simples <code>'</code> en selectores y valores de input</h2>
    <div class="lab-context">
      <b>¿Cuándo afecta a tu empresa?</b>
      <ul>
        <li>Apps en inglés, francés o irlandés cuyos atributos de test contienen apóstrofes:
            <code>data-cy="o'brien-login"</code>, <code>aria-label="Don't submit"</code>.</li>
        <li>Inputs donde el usuario escribe texto libre que puede contener comillas simples
            o barras invertidas: contraseñas, rutas de fichero, comentarios.</li>
        <li><b>No te afecta</b> si tus atributos siguen la convención <code>kebab-case</code>
            sin caracteres especiales y tus tests no capturan texto libre.</li>
      </ul>
      <b>Riesgo sin el fix:</b> el comando generado quedaría como
      <code>cy.get('[data-cy="o'brien"]').click()</code> — la comilla interior rompe la cadena
      JS y el fichero <code>.cy.ts</code> no compila.
    </div>
    <div class="lab-section">
      <p class="lab-step">1. Inicia grabación · 2. Haz clic en cada elemento · 3. Escribe en los inputs · 4. Detén grabación</p>
      <div class="lab-demo">
        <button data-cy="o'brien-btn" class="lab-btn">
          <span class="lab-action">Clic aquí</span>
          <span class="lab-attr">data-cy=<code>"o'brien-btn"</code></span>
        </button>
        <a href="#" aria-label="don't click me" class="lab-btn">
          <span class="lab-action">Clic aquí</span>
          <span class="lab-attr">aria-label=<code>"don't click me"</code></span>
        </a>
      </div>
      <div class="lab-inputs">
        <div class="lab-input-row">
          <input data-cy="apostrophe-input" class="lab-input"
                 placeholder="Escribe aquí…" />
          <span class="lab-hint">Prueba: &nbsp;<code>it's a valid input</code></span>
        </div>
        <div class="lab-input-row">
          <input data-cy="backslash-input" class="lab-input"
                 placeholder="Escribe aquí…" />
          <span class="lab-hint">Prueba: &nbsp;<code>path\to\file</code></span>
        </div>
      </div>
      <div class="lab-check">
        <b>✅ Resultado esperado en el comando generado:</b><br>
        <code>cy.get('[data-cy="apostrophe-input"]').clear().type('it\'s a valid input')</code><br>
        <code>cy.get('[data-cy="backslash-input"]').clear().type('path\\\\to\\\\file')</code><br>
        <span class="lab-note">Los apóstrofes y barras deben aparecer escapados (<code>\'</code> / <code>\\\\</code>)
        para que el fichero .cy.ts compile sin errores.</span>
      </div>
    </div>

    <!-- ── Caso B ── -->
    <h2 class="lab-h2">Caso B — Comillas dobles <code>"</code> dentro de atributos <code>data-cy</code> / <code>aria-label</code></h2>
    <div class="lab-context">
      <b>¿Cuándo afecta a tu empresa?</b>
      <ul>
        <li>Atributos generados dinámicamente por un CMS que no sanitiza su salida.</li>
        <li>Labels con unidades anglosajones: <code>aria-label='Pantalla 27"'</code>,
            <code>aria-label='Tiempo: 5"'</code>.</li>
        <li><b>Caso muy raro en la práctica.</b> Si tu equipo escribe los atributos a mano
            siguiendo la convención habitual, esto <b>no te afecta</b>. Nadie escribe
            <code>data-cy='say "hello"'</code> voluntariamente.</li>
      </ul>
      <b>Riesgo sin el fix:</b> el selector CSS quedaría
      <code>[data-cy="say "hello""]</code> — las comillas interiores cierran el valor del
      atributo prematuramente y el selector es inválido.
    </div>
    <div class="lab-section">
      <p class="lab-step">1. Inicia grabación · 2. Haz clic en cada elemento · 3. Detén grabación</p>
      <div class="lab-demo">
        <button data-cy='say "hello"' class="lab-btn">
          <span class="lab-action">Clic aquí</span>
          <span class="lab-attr">data-cy=<code>'say "hello"'</code></span>
        </button>
        <a href="#" aria-label='10" screen' class="lab-btn">
          <span class="lab-action">Clic aquí</span>
          <span class="lab-attr">aria-label=<code>'10" screen'</code></span>
        </a>
      </div>
      <div class="lab-check">
        <b>✅ Resultado esperado en el comando generado:</b><br>
        <code>cy.get('[data-cy="say \\"hello\\""]').click()</code><br>
        <span class="lab-note">Las comillas dobles interiores deben aparecer como <code>\\"</code>
        en el fichero .cy.ts para que el selector CSS sea válido.</span>
      </div>
    </div>

    <!-- ── Caso C ── -->
    <h2 class="lab-h2">Caso C — Claves JSON en kebab-case en respuestas HTTP</h2>
    <div class="lab-context">
      <b>¿Cuándo afecta a tu empresa?</b>
      <ul>
        <li>APIs REST legacy que devuelven claves en kebab-case:
            <code>{ "user-id": 1, "created-at": "…" }</code>.</li>
        <li>Integraciones con servicios externos: muchas APIs de terceros usan este formato
            (Stripe: <code>"payment-intent"</code>, cabeceras HTTP como cuerpo de respuesta:
            <code>"Content-Type"</code>, <code>"x-auth-token"</code>).</li>
        <li><b>No te afecta</b> si todas tus APIs usan camelCase (<code>userId</code>,
            <code>authToken</code>), que es la convención recomendada en JavaScript/TypeScript.</li>
      </ul>
      <b>Riesgo sin el fix:</b> el comando generado sería
      <code>expect(body.user-id).to.equal(42)</code> — JavaScript interpreta esto como
      <em>body.user menos id</em> (resta), no como acceso a la propiedad. El test compila
      pero produce resultados incorrectos en silencio.
    </div>
    <div class="lab-section">
      <p class="lab-step">
        1. Activa "Validaciones de body HTTP" en Configuración (Ctrl+3) ·
        2. Inicia grabación · 3. Pulsa el botón · 4. Detén grabación
      </p>
      <div class="lab-demo">
        <button id="lab-edge-fetch" data-cy="btn-edge-case-fetch" class="lab-btn">
          <span class="lab-action">GET /api/edge-case</span>
          <span class="lab-attr">Respuesta con claves kebab-case</span>
        </button>
      </div>
      <div id="lab-edge-result" class="lab-result" style="display:none"></div>
      <div class="lab-check">
        <b>✅ Resultado esperado en los comandos generados:</b><br>
        <code>expect(body['user-id']).to.equal(42);</code><br>
        <code>expect(body['x-auth-token']).to.equal('abc-123');</code><br>
        <code>expect(body['Content-Type']).to.equal('application/json');</code><br>
        <code>expect(body.normalKey).to.equal('valor normal');</code><br>
        <span class="lab-note">Claves con guión o mayúscula interior → corchetes <code>['…']</code>.
        camelCase puro → punto <code>.normalKey</code>.</span>
      </div>
    </div>

    <!-- ── Caso D ── -->
    <h2 class="lab-h2">Caso D — Campos sensibles en respuestas HTTP (contraseñas, tokens)</h2>
    <div class="lab-context">
      <b>¿Cuándo afecta a tu empresa?</b>
      <ul>
        <li>Tu API de autenticación devuelve el token en el body:
            <code>{ "token": "eyJhbGci…" }</code> — sin redacción, la credencial real
            quedaría <b>hardcodeada en el repositorio</b> dentro del test generado.</li>
        <li>Usas <b>Fixtures HTTP</b> y el <code>.json</code> del fixture contendría
            la contraseña en texto plano.</li>
        <li><b>No te afecta</b> si tus APIs nunca devuelven tokens ni credenciales en el body,
            o si no activas "Validaciones de body HTTP" ni "Fixtures HTTP".</li>
      </ul>
      <b>Con el fix:</b> cualquier clave que coincida con
      <code>password</code>, <code>token</code>, <code>secret</code>, <code>authorization</code>,
      <code>cookie</code>, <code>access_token</code> o <code>refresh_token</code>
      (sin distinguir mayúsculas) se sustituye por <code>[REDACTED]</code> antes de
      escribir el test. Los demás campos pasan intactos.
    </div>
    <div class="lab-section">
      <p class="lab-step">
        1. Activa "Validaciones de body HTTP" en Configuración (Ctrl+3) ·
        2. Inicia grabación · 3. Pulsa un botón · 4. Detén grabación
      </p>
      <div class="lab-demo">
        <button id="lab-sensitive-get" data-cy="btn-sensitive-get" class="lab-btn">
          <span class="lab-action">GET /api/sensitive</span>
          <span class="lab-attr">Respuesta: token + userId</span>
        </button>
        <button id="lab-sensitive-post" data-cy="btn-sensitive-post" class="lab-btn">
          <span class="lab-action">POST /api/login</span>
          <span class="lab-attr">Body: password · Respuesta: access_token</span>
        </button>
      </div>
      <div id="lab-sensitive-result" class="lab-result" style="display:none"></div>
      <div class="lab-check">
        <b>✅ Resultado esperado (GET):</b><br>
        <code>expect(body.token).to.equal("[REDACTED]");</code><br>
        <code>expect(body.userId).to.equal(1);</code><br>
        <b>✅ Resultado esperado (POST):</b><br>
        <code>expect(body.access_token).to.equal("[REDACTED]");</code><br>
        <code>expect(body.userId).to.equal(42);</code><br>
        <span class="lab-note">Los campos sensibles se redactan. <code>userId</code> pasa intacto.</span>
      </div>
    </div>

    <!-- ── Caso E ── -->
    <h2 class="lab-h2">Caso E — Subida de ficheros (<code>input[type="file"]</code> → <code>.selectFile()</code>)</h2>
    <div class="lab-context">
      <b>¿Cuándo afecta a tu empresa?</b>
      <ul>
        <li>Formularios con adjuntos: facturas, contratos, imágenes de perfil.</li>
        <li>Importadores de datos que aceptan <code>.csv</code> o <code>.xlsx</code>.</li>
        <li><b>No te afecta</b> si tu app no tiene ningún campo de subida de fichero.</li>
      </ul>
      <b>Dos bifurcaciones a probar:</b>
      <ul>
        <li><b>Guardar en IndexedDB</b> → se genera el comando y aparece un toast avisando de que debes añadir el fichero a <code>cypress/fixtures/</code> manualmente antes de ejecutar el test.</li>
        <li><b>Guardar y editar (FSAA)</b> → el fichero se copia automáticamente a <code>cypress/fixtures/</code> y un toast confirma la copia.</li>
      </ul>
    </div>
    <div class="lab-section">
      <p class="lab-step">
        1. Inicia grabación ·
        2. Selecciona un fichero en cada input ·
        3. Detén grabación ·
        4. Prueba <b>guardar en IndexedDB</b> (debes ver el toast de aviso) ·
        5. Repite y prueba <b>Guardar y editar</b> con la carpeta Cypress configurada (debes ver el toast de confirmación de copia)
      </p>
      <div class="lab-demo" style="flex-direction:column;gap:16px">
        <div class="lab-file-row">
          <label class="lab-file-label" for="lab-file-single">
            Fichero único
            <span class="lab-attr">input[type="file"] · data-cy="lab-file-single"</span>
          </label>
          <input id="lab-file-single"
                 data-cy="lab-file-single"
                 type="file"
                 class="lab-file-input" />
          <span id="lab-file-single-name" class="lab-file-name">— ninguno —</span>
        </div>
        <div class="lab-file-row">
          <label class="lab-file-label" for="lab-file-multiple">
            Múltiples ficheros
            <span class="lab-attr">input[type="file"][multiple] · data-cy="lab-file-multiple"</span>
          </label>
          <input id="lab-file-multiple"
                 data-cy="lab-file-multiple"
                 type="file"
                 multiple
                 class="lab-file-input" />
          <span id="lab-file-multiple-name" class="lab-file-name">— ninguno —</span>
        </div>
      </div>
      <div class="lab-check">
        <b>✅ Resultado esperado (fichero único: factura.pdf):</b><br>
        <code>cy.get('[data-cy="lab-file-single"]').selectFile('cypress/fixtures/factura.pdf')</code><br>
        <b>✅ Resultado esperado (múltiples: a.csv + b.xlsx):</b><br>
        <code>cy.get('[data-cy="lab-file-multiple"]').selectFile(['cypress/fixtures/a.csv', 'cypress/fixtures/b.xlsx'])</code><br>
        <b>✅ Toast IndexedDB:</b> aviso de que debes añadir el fichero manualmente a <code>cypress/fixtures/</code><br>
        <b>✅ Toast FSAA:</b> confirmación de que el fichero ha sido copiado a <code>cypress/fixtures/</code><br>
        <span class="lab-note">No debe generarse ningún <code>.click()</code> previo — <code>.selectFile()</code> reemplaza toda la interacción.</span>
      </div>
    </div>

  </div>

  <style>
    .lab-warn {
      background: rgba(210,153,34,.1); border: 1px solid rgba(210,153,34,.3);
      border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #d29922;
      margin-bottom: 24px; line-height: 1.6;
    }
    .lab-h2 {
      font-size: 14px; color: #e6edf3; margin: 28px 0 10px; padding-bottom: 8px;
      border-bottom: 1px solid #21262d;
    }
    .lab-context {
      background: #161b22; border: 1px solid #30363d; border-radius: 8px;
      padding: 14px 16px; font-size: 12px; color: #8b949e; margin-bottom: 12px;
      line-height: 1.7;
    }
    .lab-context ul { margin: 6px 0 4px 16px; padding: 0; }
    .lab-context li { margin-bottom: 4px; }
    .lab-section {
      background: #0d1117; border: 1px solid #21262d; border-radius: 8px;
      padding: 16px; margin-bottom: 4px;
    }
    .lab-step {
      font-size: 11px; color: #8b949e; margin: 0 0 14px;
      border-left: 2px solid #30363d; padding-left: 10px;
    }
    .lab-demo { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .lab-btn {
      display: flex; flex-direction: column; gap: 4px;
      background: #21262d; border: 1px solid #30363d; border-radius: 6px;
      color: #e6edf3; padding: 10px 14px; cursor: pointer; font-size: 12px;
      text-align: center; text-decoration: none; transition: border-color .12s;
      min-width: 140px;
    }
    .lab-btn:hover { border-color: #2f81f7; }
    .lab-action { font-size: 13px; font-weight: 600; }
    .lab-attr { font-size: 11px; color: #8b949e; }
    .lab-inputs { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .lab-input-row { display: flex; align-items: center; gap: 12px; }
    .lab-input {
      flex: 1; max-width: 280px; padding: 7px 10px; background: #161b22;
      border: 1px solid #30363d; border-radius: 6px; color: #e6edf3;
      font-size: 12px; font-family: inherit;
    }
    .lab-hint { font-size: 11px; color: #8b949e; white-space: nowrap; }
    .lab-check {
      background: rgba(63,185,80,.07); border: 1px solid rgba(63,185,80,.2);
      border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #c9d1d9;
      line-height: 1.9;
    }
    .lab-note { font-size: 11px; color: #8b949e; display: block; margin-top: 6px; }
    .lab-result {
      background: #161b22; border: 1px solid #30363d; border-radius: 6px;
      padding: 10px 14px; font-size: 12px; color: #3fb950; font-family: monospace;
      margin-bottom: 12px; white-space: pre-wrap;
    }
    .lab-file-row {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
    .lab-file-label {
      display: flex; flex-direction: column; gap: 3px;
      font-size: 12px; font-weight: 600; color: #e6edf3; min-width: 180px;
    }
    .lab-file-input {
      font-size: 12px; color: #c9d1d9;
      background: #161b22; border: 1px solid #30363d; border-radius: 6px;
      padding: 6px 10px; cursor: pointer;
    }
    .lab-file-name {
      font-size: 11px; color: #8b949e; font-family: monospace;
    }
  </style>`;

  el.querySelector<HTMLInputElement>('#lab-file-single')
    ?.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      const nameEl = el.querySelector<HTMLElement>('#lab-file-single-name');
      if (nameEl) nameEl.textContent = input.files?.[0]?.name ?? '— ninguno —';
    });

  el.querySelector<HTMLInputElement>('#lab-file-multiple')
    ?.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      const nameEl = el.querySelector<HTMLElement>('#lab-file-multiple-name');
      if (nameEl) {
        const names = input.files ? Array.from(input.files).map(f => f.name).join(', ') : '';
        nameEl.textContent = names || '— ninguno —';
      }
    });

  el.querySelector<HTMLButtonElement>('#lab-edge-fetch')
    ?.addEventListener('click', async () => {
      const resultEl = el.querySelector<HTMLElement>('#lab-edge-result');
      try {
        const res = await fetch('/api/edge-case');
        const data = await res.json() as unknown;
        if (resultEl) {
          resultEl.style.display = 'block';
          resultEl.textContent = JSON.stringify(data, null, 2);
        }
      } catch (e: unknown) {
        if (resultEl) {
          resultEl.style.display = 'block';
          resultEl.textContent = `Error: ${String(e)}`;
        }
      }
    });

  const sensitiveResultEl = el.querySelector<HTMLElement>('#lab-sensitive-result');

  el.querySelector<HTMLButtonElement>('#lab-sensitive-get')
    ?.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/sensitive');
        const data = await res.json() as unknown;
        if (sensitiveResultEl) {
          sensitiveResultEl.style.display = 'block';
          sensitiveResultEl.textContent = JSON.stringify(data, null, 2);
        }
      } catch (e: unknown) {
        if (sensitiveResultEl) {
          sensitiveResultEl.style.display = 'block';
          sensitiveResultEl.textContent = `Error: ${String(e)}`;
        }
      }
    });

  el.querySelector<HTMLButtonElement>('#lab-sensitive-post')
    ?.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'alice', password: 'hunter2' }),
        });
        const data = await res.json() as unknown;
        if (sensitiveResultEl) {
          sensitiveResultEl.style.display = 'block';
          sensitiveResultEl.textContent = JSON.stringify(data, null, 2);
        }
      } catch (e: unknown) {
        if (sensitiveResultEl) {
          sensitiveResultEl.style.display = 'block';
          sensitiveResultEl.textContent = `Error: ${String(e)}`;
        }
      }
    });
}
