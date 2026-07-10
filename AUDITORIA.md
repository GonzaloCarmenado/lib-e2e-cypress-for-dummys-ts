# Auditoría — lib-e2e-cypress-for-dummys-ts

> Informe generado el 2026-07-09. Pensado como backlog de mejora técnica, no como bloqueo — priorizar según impacto/esfuerzo indicado en cada sección.

**Qué es:** librería TS pura (Custom Elements + Shadow DOM, sin framework) que se monta como widget flotante para grabar interacciones del usuario y generar tests Cypress. Migrada recientemente desde una lib Angular. Sigue SDD (specs numeradas) + TDD, ~961 tests, cobertura 95%.

## Notas globales

| Dimensión | Nota | Resumen |
|---|---|---|
| Seguridad | — | Buena disciplina de escapado en UI; **inyección real de código** en el generador de tests |
| Arquitectura | 6/10 | God-object en el componente raíz, DI con dos convenciones inconsistentes |
| Calidad de código | 7/10 | Cobertura y lint limpios; duplicación estructural y sin límites de complejidad |
| Organización/proceso | 7.5/10 | SDD/TDD disciplinado; sin CI, docs de transición obsoletas |

---

## 🔴 Seguridad — lo más urgente

- [ ] **Inyección en el código Cypress generado** — `src/services/recording.service.ts:559,581,598-628` y `src/services/http-monitor.ts:19-24`.
  Los selectores/atributos capturados del DOM host (`data-cy`, `id`, `aria-label`) y las claves JSON de respuestas HTTP se interpolan **sin escapar** al construir comandos, y se persisten como `.spec.ts` reales que luego se ejecutan. Si la app grabada tiene un atributo o un campo de API con una comilla/backtick, se rompe la sintaxis del test generado o, peor, se inyecta código ejecutable (incluyendo `cy.exec`, que corre comandos de shell).
  Ya existe la utilidad correcta (`escapeSingleQuotes`/`normalizeBlock` en `src/utils/code-format.utils.ts`, con el orden de escape correcto backslash→comilla) — simplemente no se usa en todos los puntos.
  **Recomendación:** reutilizar esa utilidad en todos los puntos de `recording.service.ts` y `http-monitor.ts`, y validar `key` como identificador válido antes de interpolarlo.
  **Este es el hallazgo con más impacto real del repo.**

- [ ] **CORS `*` en el runner local** — `src/runner/runner.ts:92` (`Access-Control-Allow-Origin: '*'`).
  Cualquier pestaña abierta en el navegador del developer mientras corre `npx lib-e2e-cypress-runner` puede hacer `POST http://127.0.0.1:8123/run-test` y disparar `cypress run` sobre specs existentes sin consentimiento (CSRF/DNS-rebinding contra localhost).
  **Recomendación:** restringir `Access-Control-Allow-Origin` al origin real de la app host, o exigir un token/nonce compartido.

- [ ] **Captura de bodies HTTP sin redacción** — `src/services/http-monitor.ts:181-247`, `src/services/persistence.service.ts`.
  Si se grava un login o un pago, tokens/contraseñas/PII quedan en claro en IndexedDB y pueden acabar como fixtures `.json` commiteados al repo. No hay lista de exclusión de headers/campos sensibles.
  **Recomendación:** redactar campos conocidos (`password`, `token`, `secret`, `authorization`, `cookie`) antes de `registerFixture`/`addCommand`.

- [ ] **Nombres de Custom Elements sin namespacing** — `help-panel.ts:38`, `selector-picker.ts:168`, `save-test.ts:100`, `file-preview.ts:167`, `test-editor.ts:203`, `test-previsualizer.ts:121`.
  Tags genéricos sin prefijo; si el host ya define un elemento con ese nombre, `customElements.define` lanza y rompe el registro de todo el widget (sin try/catch).
  **Recomendación:** prefijar todos los tags (`lib-e2e-*`) y envolver el registro en try/catch.

### Verificado limpio (sin acción necesaria)
- XSS en templates: todo el contenido dinámico pasa por `escHtml`/`escAttr`/`syntaxHighlight`. Sin `eval`, `new Function`, `document.write`.
- Sin secretos hardcodeados en el código.
- `npm audit`: 9 vulnerabilidades, todas en devDependencies (toolchain vitest/vite/esbuild), no se publican. Dependencias de producción (`idb`, `sweetalert2`) limpias.
- Sin control de cuota en IndexedDB — DoS local de bajo impacto, aceptable en contexto dev.

### Nota de contexto
Esta librería no se despliega en producción (herramienta de dev/QA), y no existe ningún guard automático que lo impida — depende 100% de que el consumidor no monte el componente en producción. Si eso ocurriera por error, los hallazgos "alta/media" pasarían a crítica (fuga de tokens de usuarios reales, ejecución de comandos vía runner expuesto). Merece una advertencia muy visible en el README.

---

## 🟠 Arquitectura

- [ ] **God-object en `src/components/lib-e2e-recorder/lib-e2e-recorder.ts` (1045 líneas)**.
  Conoce/orquesta 4 servicios (`RecordingService`, `PersistenceService`, `TranslationService`, `HttpMonitor`) y 8 Custom Elements hijos, mezclando drag&drop, atajos de teclado, continuidad de sesión cross-app, historial en `localStorage`, Filesystem Access API y construcción manual de 6 modales con HTML inline. Casi tan grande como todos los servicios juntos (1337 líneas).
  **Recomendación:** extraer `SessionContinuityService`/`ModalOrchestrator` — alto impacto, esfuerzo medio, sin tocar contratos públicos.

- [ ] **DI inconsistente con código muerto**.
  `persistence.service.ts:309` exporta un singleton `persistenceService` que **nunca se usa** en todo el código. Mientras tanto, `translationService` sí se usa como default en 4 componentes (`file-preview.ts:14`, `save-test.ts:16`, `test-editor.ts:13`, `test-previsualizer.ts:11`), y otros 4 (`advanced-test-editor.ts:47`, `configuration.ts:44-45`, `help-panel.ts:21`, `lib-e2e-recorder.ts:136-137`) ignoran el singleton y hacen `new XService()` directamente. Dos convenciones convivendo sin criterio.
  **Recomendación:** eliminar el singleton muerto o unificar todos los componentes al mismo patrón — esfuerzo bajo.

- [ ] **`HttpMonitor` gestiona un recurso global como si fuera de instancia** — `src/services/http-monitor.ts:86-87,111-112,133-134`.
  Cada instancia guarda su propio `originalFetch`/`originalXHR`. Con dos widgets en la misma página, el segundo `install()` captura como "original" el `fetch` ya parcheado por el primero; si el primero se desmonta después, su `uninstall()` sobrescribe `window.fetch` con el nativo, destruyendo silenciosamente el parche del segundo.
  **Recomendación:** convertir en singleton real con contador de referencias — alto impacto/riesgo real, esfuerzo bajo.

- [ ] **Gestión de suscripciones sin red de seguridad**.
  Patrón `Subject<T>` casero (`src/utils/subject.ts`) sin cleanup reforzado. Solo 2 de 8 componentes se desuscriben en `disconnectedCallback` (`lib-e2e-recorder.ts:176-182`, `selector-picker.ts:41-42`). Hoy no hay leak activo, pero nada lo impide a futuro.
  **Recomendación:** añadir guard/lint que obligue a desuscribir cuando se llama a `onXChange` — esfuerzo medio.

- [ ] **Barrel `src/index.ts` expone más de lo necesario**.
  Expone `Subject` (detalle interno, no API) y los 8 Custom Elements individuales como si fueran de uso independiente, cuando son subcomponentes de implementación del widget principal.
  **Recomendación:** no exportar `Subject` ni Custom Elements internos salvo `lib-e2e-recorder` — esfuerzo bajo.

- [ ] **Patrón SweetAlert2 + `didOpen` frágil**.
  Casts `as unknown as XEl`, acceso a estructura interna de Swal2, encadenado de modales con `setTimeout(..., 150)` en vez de promesas/eventos.
  **Recomendación:** evaluar `<dialog>` nativo + slots o `CustomEvent` bubbling/composed como alternativa más idiomática (baja prioridad, cambio de fondo).

- [ ] **Documentación de migración obsoleta** — ver sección de organización.

---

## 🟡 Calidad de código

- [ ] **Reglas de type-safety debilitadas sin necesidad** — `eslint.config.js:21`.
  `no-explicit-any` y `no-non-null-assertion` están en `warn`, no `error`. El código actual no usa `any` en ningún sitio (`grep` sin resultados), así que subirlas a error no cuesta nada y cierra la puerta a futuras regresiones.

- [ ] **Duplicación del patrón "lazy DI"** copiado literalmente en 5 componentes:
  `help-panel.ts:21`, `configuration.ts:44-45`, `test-editor.ts:30`, `advanced-test-editor.ts:46-47`, `lib-e2e-recorder.ts:136-137`.
  **Recomendación:** extraer a un helper/mixin común.

- [ ] **Cobertura por debajo del 80% en algunos archivos** (el agregado es 95.68%, pero por archivo):
  - `src/components/test-editor/test-editor.ts` → 79.41% branch (líneas 61-63, 174-175 sin cubrir).
  - `src/models/login-setup.model.ts` → 0% líneas (nunca se importa en tests; `DEFAULT_LOGIN_SETUP_CONFIG` sin ejercitar).

- [ ] **`tsconfig.json` sin flags adicionales de calidad**: falta `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Relevante porque hay mucho acceso indexado en `db-schema.model.ts` y `configuration.template.ts`.

- [ ] **Sin límites de tamaño/complejidad en ESLint**: no hay reglas `complexity`, `max-lines`, `max-lines-per-function`, `max-params` — nada impide que vuelva a crecer otro god-file como `lib-e2e-recorder.ts`.

- [ ] **Top 5 archivos más grandes** (candidatos a revisión si crecen más):
  ```
  1045  src/components/lib-e2e-recorder/lib-e2e-recorder.ts
   653  src/services/recording.service.ts
   384  src/components/advanced-test-editor/advanced-test-editor.ts
   365  src/components/configuration/configuration.ts
   339  src/components/configuration/configuration.template.ts
  ```

### Verificado limpio (sin acción necesaria)
- `npm run lint` → exit 0, sin errores ni warnings.
- 961 tests, todos pasan; cobertura global 95.68% líneas / 88.02% branch / 95.96% funcs.
- Sin `any`, `as any`, `@ts-ignore`, `@ts-expect-error` en `src/`.
- i18n: sin strings estáticos fuera de `t(...)` salvo endónimos de idioma en `configuration.template.ts:8-12` (aceptable).
- TODOs/FIXMEs: solo 6, todos documentados y legítimos (traducciones pendientes, plantilla de login).

---

## 🟢 Organización y proceso

- [ ] **No hay CI** — no existe `.github/workflows/` ni ningún pipeline. El único gate es local (`prepublishOnly` en `package.json`, hooks de husky pre-commit/pre-push). Un colaborador puede saltárselo con `--no-verify`.
  **Recomendación:** añadir GitHub Actions que corra lint+test+coverage+build en cada push/PR.

- [ ] **`HANDOFF.md` y `MIGRATION_PLAN.md` obsoletos**. Describen una estructura (`angular-native/` + `original/`) que ya no existe — el repo actual tiene `src/` en la raíz y `ejemplo/` es ahora un monorepo Vite+Module Federation (spec 016), no la app Angular original. Son reliquias de una migración ya completada.
  **Recomendación:** archivar en `docs/archive/` o eliminar.

- [ ] **`docs/ROADMAP.md` desactualizado**: lista como "backlog" funcionalidades ya shippeadas en specs 011/012, y no refleja que `package.json` ya está en 0.9.0.
  **Recomendación:** actualizar o archivar.

- [ ] **Hueco sin explicar: spec `013` no existe** (numeración salta de 012 a 014). No hay mención en ROADMAP/HANDOFF/MIGRATION_PLAN.
  **Recomendación:** documentar por qué se saltó o reservar el número.

- [ ] **Tags de git desincronizados de la versión real**: solo llegan a `v0.7.0`, faltan `v0.8.0`/`v0.9.0`. Sin `CHANGELOG.md`.
  **Recomendación:** generar changelog (ej. changesets/semantic-release) y crear los tags que faltan.

- [ ] **Publicación a npm no automatizada**: depende de `prepublishOnly` manual, sin workflow de publish.
  **Recomendación:** automatizar vía GitHub Actions al crear un tag.

- [ ] **README sin índice/TOC** (29 KB, bien estructurado por encabezados pero sin navegación rápida).
  **Recomendación:** añadir TOC enlazado al inicio, o mover secciones largas (API pública, features) a `docs/`.

### Verificado limpio (sin acción necesaria)
- 100% de los últimos 40 commits cumple Conventional Commits.
- Hooks de husky (`pre-commit` → lint-staged, `pre-push` → test + coverage) alineados exactamente con lo documentado en `CLAUDE.md`.
- Specs en `docs/specs/` vivas y bien mantenidas, con secciones de historial no exigidas por el template.

---

## Top 5 si solo hay tiempo para eso

1. Escapar/validar selectores y claves JSON antes de generar código Cypress (`recording.service.ts`, `http-monitor.ts`) — es inyección de código real, no cosmético.
2. Cerrar CORS del runner (`runner.ts:92`) a un origin conocido.
3. Añadir CI en GitHub Actions (lint+test+coverage+build por PR).
4. Descomponer `lib-e2e-recorder.ts` extrayendo sesión/modales a servicios propios.
5. Archivar `HANDOFF.md`/`MIGRATION_PLAN.md` y actualizar `ROADMAP.md`.
