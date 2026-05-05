# Plan de Migración: Angular → TypeScript Puro
## Metodología: Spec-Driven Development (SDD)

> **Regla SDD**: Cada fase comienza escribiendo los specs (archivos `.spec.ts`) que definen
> el contrato público. Solo se implementa para hacer pasar esos specs. Nunca al revés.

---

## Mapa de sustitución de dependencias Angular

| Angular / Angular-dep | Reemplazo TypeScript puro |
|-----------------------|---------------------------|
| `@Injectable` / DI system | Clases TS con singleton manual |
| `BehaviorSubject` (RxJS) | Micro pub/sub con `EventTarget` nativo |
| `Observable<T>` como retorno | `Promise<T>` + callbacks de suscripción |
| `HttpInterceptorFn` | Monkey-patch de `window.fetch` + `XMLHttpRequest` |
| `ngx-indexed-db` | `idb` (~4 KB, sin framework) |
| `@Component` + templates HTML | Custom Elements (Web Components API) |
| `@Input` / `@Output` | Propiedades + `CustomEvent` en el elemento |
| `NgModule` | ES module `export` estándar |
| Shadow DOM | `element.attachShadow({ mode: 'open' })` nativo |
| `[ngModel]` / `FormsModule` | Event listeners nativos DOM |
| `RouterModule` (detección rutas) | Ya usaba `history.pushState` / `popstate` → sin cambios |
| `SweetAlert2` | Sin cambios (no tiene dep Angular) |
| `@codemirror/*` | Sin cambios (no tiene dep Angular) |

---

## FASE 0 — Setup del proyecto TypeScript

**Objetivo**: Scaffolding con build pipeline y test runner funcionales.

### Specs a escribir
- `specs/setup.spec.ts`
  - El build produce output `dist/index.mjs` (ESM) y `dist/index.cjs` (CJS)
  - Los tipos `.d.ts` se generan correctamente
  - El entry point `src/index.ts` es importable

### Tareas de implementación
1. `package.json` — nombre, versión, campo `exports` con ESM/CJS/types
2. `tsconfig.json` — target ES2022, lib DOM, strict, declaration
3. `tsup.config.ts` — entry: `src/index.ts`, formats: `esm,cjs`, dts: true
4. `vitest.config.ts` — environment: jsdom (para tests de DOM)
5. Estructura de carpetas:
```
angular-native/
├── src/
│   ├── services/
│   ├── components/
│   ├── models/
│   ├── utils/
│   └── index.ts
├── specs/
│   └── components/
└── dist/          (generado)
```

---

## FASE 1 — Modelos y tipos

**Objetivo**: Contratos de tipos sin lógica. Base para el resto de fases.

### Specs a escribir
- `specs/models.spec.ts`
  - `Lang` solo acepta `'es' | 'en' | 'fr' | 'it' | 'de'`
  - `INPUT_TYPES` contiene exactamente los 8 tipos de input definidos
  - La interfaz `DBConfig` tiene las propiedades `name`, `version`, `stores`
  - El esquema de la BD define los 4 stores: `tests`, `commands`, `interceptors`, `configuration`

### Tareas de implementación
1. `src/models/lang.model.ts` — type `Lang`
2. `src/models/input-types.model.ts` — constante `INPUT_TYPES`
3. `src/models/db-schema.model.ts` — interfaces y esquema de IndexedDB

---

## FASE 2 — TranslationService

**Objetivo**: Servicio i18n puro, sin ninguna dependencia Angular.

### Specs a escribir
- `specs/translation.service.spec.ts`
  - `translate('MAIN_FRAME.RECORD')` devuelve el string correcto en el idioma activo
  - `setLang('en')` → `getLang()` devuelve `'en'`
  - `detectLang()` devuelve `'es'` si el idioma del navegador no está soportado
  - Una clave inexistente devuelve la propia clave como fallback (no lanza error)
  - `translate` con clave anidada (`'A.B.C'`) resuelve correctamente el valor

### Tareas de implementación
1. `src/services/translation.service.ts` — clase singleton
2. `src/i18n/es.ts`, `en.ts`, `fr.ts`, `it.ts`, `de.ts` — objetos de traducción tipados

---

## FASE 3 — Transformation Services

**Objetivo**: Lógica de transformación de texto. Sin efectos secundarios ni dependencias.

### Specs a escribir
- `specs/transformation.service.spec.ts`
  - `generateItDescription(desc, cmds)` produce un bloque `it('desc', () => { ... })` válido
  - `toLang('xx')` devuelve `'en'` para idiomas no soportados
  - `toLang('es')` devuelve `'es'`
  - `insertBeforeEach(content, interceptors)` inserta el bloque después de `describe(`
  - `insertItBlock(content, itBlock)` inserta antes del `})` final del archivo
  - `scanDirectory(handle)` construye árbol con `{ name, children?, handle }` correcto
  - `isFile(entry)` distingue correctamente ficheros de directorios

### Tareas de implementación
1. `src/services/transformation.service.ts`
2. `src/services/advanced-test.transformation.service.ts`

---

## FASE 4 — RecordingService

**Objetivo**: Captura de eventos DOM → comandos Cypress. Núcleo de la librería.

### Specs a escribir
- `specs/recording.service.spec.ts`
  - `startRecording()` emite los comandos iniciales: viewport, visit, hide
  - Click en `[data-cy="foo"]` → genera `cy.get('[data-cy="foo"]').click()`
  - Click en `#valid-id` sin data-cy → genera `cy.get('#valid-id').click()`
  - Click en input o select → NO genera comando click (se delega a sus propios listeners)
  - Input en `input[type=text]` (con debounce simulado) → genera `.clear().type('value')`
  - Change en `select` → genera `.select('value')`
  - `history.pushState` a nueva ruta → genera `cy.url().should('include', '/nueva-ruta')`
  - `stopRecording()` → eventos posteriores no generan comandos
  - `clearCommands()` → `getCommandsSnapshot()` devuelve `[]`
  - `clearInterceptors()` → `getInterceptorsSnapshot()` devuelve `[]`
  - `registerInterceptor('GET', '/api/users', 'alias')` → añade al array de interceptors
  - Suscripción con `onCommandsChange(cb)` recibe actualizaciones en tiempo real

### Estrategia pub/sub (sin RxJS)
```typescript
// src/utils/observable.ts
class Subject<T> {
  private listeners: Array<(v: T) => void> = [];
  next(value: T) { this.listeners.forEach(l => l(value)); }
  subscribe(fn: (v: T) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }
  getValue() { return this._value; }
}
```

### Tareas de implementación
1. `src/utils/subject.ts` — micro pub/sub
2. `src/services/recording.service.ts`

---

## FASE 5 — PersistenceService

**Objetivo**: CRUD sobre IndexedDB. Reemplaza `ngx-indexed-db` con `idb`.

### Specs a escribir
- `specs/persistence.service.spec.ts`
  - `insertTest('mi test')` → devuelve `Promise<number>` con el id generado
  - `getAllTests()` → `Promise<Test[]>` — incluye los tests insertados
  - `getTestById(id)` → devuelve el test con `itBlock` e `interceptorsBlock` formateados
  - `deleteTest(id)` → borra test + sus comandos + sus interceptores
  - `insertCommands(['cmd1', 'cmd2'], testId)` → comandos quedan ligados al test
  - `insertInterceptors(['icp1'], testId)` → interceptores ligados al test
  - `setConfig({ language: 'en' })` → `getConfig('language')` devuelve `'en'`
  - `clearAllData()` → `getAllTests()` devuelve `[]`
  - `ingestFileData(tests, interceptors)` → los datos importados son consultables

### Dependencia a añadir
- `idb` (3.7 KB, sin framework, API moderna sobre IndexedDB)

### Tareas de implementación
1. `src/services/persistence.service.ts`

---

## FASE 6 — HttpMonitor

**Objetivo**: Captura de peticiones HTTP sin Angular HttpClient. Reemplaza `CypressHttpInterceptor`.

### Estrategia
Monkey-patch de `window.fetch` (y opcionalmente `XMLHttpRequest`) para interceptar
peticiones antes/después de ejecutarse, generando los mismos comandos que el interceptor Angular.

### Specs a escribir
- `specs/http-monitor.spec.ts`
  - `install()` reemplaza `window.fetch` con una versión instrumentada
  - `uninstall()` restaura `window.fetch` original
  - GET a `/api/data` → genera `cy.intercept('GET', '**/api/data').as('alias-api-data')`
  - POST a `/api/users` → genera `cy.wait('@alias-api-users').then(...)` con validación request
  - `isExtendedHttpEnabled()` lee correctamente `localStorage.extendedHttpCommands`
  - Con `extendedHttp = false` → comandos sin bloque de validación
  - Con `extendedHttp = true` → genera validaciones de body/status

### Tareas de implementación
1. `src/services/http-monitor.ts`

---

## FASE 7 — UI Utilities

**Objetivo**: Lógica de modales, drag, resize, estilos. DOM puro, sin Angular.

### Specs a escribir
- `specs/ui-utils.spec.ts`
  - `makeModalResizable(el)` → añade listeners de resize, retorna función cleanup
  - Cleanup fn elimina los event listeners sin errores
  - `makeDraggable(el)` → permite mover el elemento con mouse dentro de los límites
  - `injectStyles(css, 'my-id')` → inyecta `<style id="my-id">` en `<head>`
  - Llamar `injectStyles` dos veces con mismo id → no duplica el `<style>`
  - `showToast('mensaje')` → crea elemento en DOM, desaparece tras ~3 segundos

### Tareas de implementación
1. `src/utils/modal.utils.ts` — resizable + draggable
2. `src/utils/styles.utils.ts` — injectStyles
3. `src/utils/toast.utils.ts`

---

## FASE 8 — Web Components

**Objetivo**: Cada componente Angular → Custom Element con Shadow DOM.

**Patrón base**:
```typescript
class MiComponente extends HTMLElement {
  static observedAttributes = ['mi-prop'];
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }
  connectedCallback() { this.render(); }
  disconnectedCallback() { /* cleanup listeners */ }
  attributeChangedCallback(name, _old, val) { /* rerender si aplica */ }
  private render() { this.shadow.innerHTML = `...`; }
}
customElements.define('mi-componente', MiComponente);
```

---

### FASE 8.1 — TestPrevisualizerComponent

**Specs:** `specs/components/test-previsualizer.spec.ts`
- Dada una lista de comandos, los renderiza en el shadow DOM
- `copyToClipboard()` copia el texto correcto al portapapeles
- `toggleInterceptors()` muestra/oculta la sección de interceptores
- Auto-scroll al fondo al actualizar comandos

### FASE 8.2 — SaveTestComponent

**Specs:** `specs/components/save-test.spec.ts`
- Estado inicial muestra el paso `ask` (¿Guardar?)
- Click en Sí → pasa al paso `desc` (pedir descripción)
- Click en Confirmar → emite `CustomEvent('savetest', { detail: descripcion })`
- Click en Cancelar → emite `CustomEvent('savetest', { detail: null })`
- Click en Guardar y exportar → emite `CustomEvent('saveandexport', { detail: descripcion })`

### FASE 8.3 — TestEditorComponent

**Specs:** `specs/components/test-editor.spec.ts`
- `loadTests()` obtiene datos de PersistenceService y los renderiza
- Click en borrar → llama `deleteTest(id)` y recarga la lista
- Click en expandir → muestra comandos; segundo click → colapsa
- `hasInterceptors(testId)` devuelve true/false correctamente

### FASE 8.4 — ConfigurationComponent

**Specs:** `specs/components/configuration.spec.ts`
- El selector de idioma persiste en IndexedDB al cambiar
- El toggle de extendedHttp guarda en `localStorage`
- `exportAllData()` descarga un JSON con estructura `{ tests: [...], interceptors: [...] }`
- `importAllData(event)` llama `clearAllData()` e `ingestFileData()` con los datos del archivo

### FASE 8.5 — AdvancedTestEditorComponent

**Specs:** `specs/components/advanced-test-editor.spec.ts`
- Sin handle guardado → muestra estado de "sin permisos" correctamente
- Con handle guardado → `getFoldersData()` construye el árbol de directorios
- `saveCommandsToFile()` combina `insertBeforeEach` + `insertItBlock` y escribe el archivo
- `onFileClick(file)` carga el contenido del archivo en `selectedFileContent`

### FASE 8.6 — FilePreviewComponent

**Specs:** `specs/components/file-preview.spec.ts`
- Inicializa CodeMirror con el `fileContent` recibido
- Cambio de `fileContent` actualiza el contenido del editor
- `saveFile()` emite `CustomEvent('save', { detail: contenidoEditor })`
- `launchTest(specPath)` hace POST a `localhost:8123/run-test`
- `launchPartialTest()` crea archivo parcial con el texto seleccionado

### FASE 8.7 — LibE2eRecorderComponent (Principal)

**Specs:** `specs/components/lib-e2e-recorder.spec.ts`
- `toggle()` alterna `isRecording` y llama a `RecordingService.toggleRecording()`
- `Ctrl+R` llama a `toggle()`
- `Ctrl+1` abre el panel de tests guardados
- `Ctrl+2` abre el panel de comandos en vivo
- `Ctrl+3` abre la configuración
- `setLanguage('en')` delega en `TranslationService.setLang('en')`
- Los modales se abren/cierran actualizando el estado correcto
- El componente se registra como `<lib-e2e-recorder>` en `customElements`

---

## FASE 9 — Public API y Build

**Objetivo**: Entry point limpio, bundle optimizado, ready para publicar en npm.

### Specs a escribir
- `specs/public-api.spec.ts`
  - El bundle ESM exporta: `RecordingService`, `PersistenceService`, `HttpMonitor`, `TranslationService`
  - El Custom Element `lib-e2e-recorder` se puede registrar con `customElements.define`
  - Los tipos `.d.ts` contienen las firmas públicas de todos los servicios
  - El bundle no contiene referencias a `@angular/`

### Tareas de implementación
1. `src/index.ts` — re-exporta la API pública
2. Ajustar `tsup.config.ts` para bundle final
3. Verificar `package.json` con campo `exports`, `main`, `module`, `types`

---

## Resumen de fases

| Fase | Módulo | Archivo spec | Dep. nuevas |
|------|--------|-------------|-------------|
| 0 | Setup & Tooling | `setup.spec.ts` | `tsup`, `vitest`, `jsdom` |
| 1 | Modelos y tipos | `models.spec.ts` | — |
| 2 | TranslationService | `translation.service.spec.ts` | — |
| 3 | TransformationServices | `transformation.service.spec.ts` | — |
| 4 | RecordingService | `recording.service.spec.ts` | — |
| 5 | PersistenceService | `persistence.service.spec.ts` | `idb` |
| 6 | HttpMonitor | `http-monitor.spec.ts` | — |
| 7 | UI Utilities | `ui-utils.spec.ts` | — |
| 8.1 | TestPrevisualizerComponent | `components/test-previsualizer.spec.ts` | — |
| 8.2 | SaveTestComponent | `components/save-test.spec.ts` | — |
| 8.3 | TestEditorComponent | `components/test-editor.spec.ts` | — |
| 8.4 | ConfigurationComponent | `components/configuration.spec.ts` | — |
| 8.5 | AdvancedTestEditorComponent | `components/advanced-test-editor.spec.ts` | — |
| 8.6 | FilePreviewComponent | `components/file-preview.spec.ts` | `@codemirror/*` |
| 8.7 | LibE2eRecorderComponent | `components/lib-e2e-recorder.spec.ts` | `sweetalert2` |
| 9 | Public API & Build | `public-api.spec.ts` | — |

**Total**: 16 archivos de spec, ~20 archivos de implementación, **0 dependencias Angular**.
