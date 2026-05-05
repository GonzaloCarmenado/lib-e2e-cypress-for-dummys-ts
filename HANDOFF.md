# lib-e2e-cypress-for-dummys — Handoff para nuevo chat

## Contexto general

Este repo contiene una librería de grabación de tests E2E para Cypress que se usa como widget flotante en apps Angular. El proyecto está en proceso de migración completa: de una librería Angular (con decoradores, DI, ngx-indexed-db, etc.) a **TypeScript puro con Custom Elements (Web Components API), zero dependencias Angular**.

---

## Estructura del repo

```
lib-e2e-cypress-for-dummys/
├── angular-native/        ← LA NUEVA LIBRERÍA (puro TS, ya funciona)
│   ├── src/
│   │   ├── components/    ← 7 Custom Elements
│   │   ├── services/      ← HttpMonitor, RecordingService, PersistenceService, etc.
│   │   ├── models/
│   │   ├── utils/
│   │   └── index.ts       ← barrel de exports
│   ├── specs/             ← 316 tests (vitest + jsdom) — todos en verde
│   ├── dist/              ← build producción (tsup ESM+CJS+.d.ts)
│   ├── package.json       ← name: "lib-e2e-cypress-for-dummys", version: 0.1.0
│   └── tsup.config.ts
│
└── original/              ← App Angular de ejemplo que consume la lib
    ├── src/
    │   ├── app/
    │   │   ├── app.component.ts   ← usa CUSTOM_ELEMENTS_SCHEMA, importa la lib via main.ts
    │   │   ├── app.component.html ← contiene <lib-e2e-recorder />
    │   │   ├── app.config.ts      ← provideHttpClient() limpio (SIN withFetch, SIN interceptores Angular)
    │   │   └── features/navigation-window/
    │   ├── main.ts                ← import 'lib-e2e-cypress-for-dummys'; (side-effect)
    │   └── assets/i18n/           ← es, en, fr, it, de
    ├── projects/lib-e2e-cypress-for-dummys/  ← ANTIGUA librería Angular (ignorar/borrar)
    ├── package.json               ← "lib-e2e-cypress-for-dummys": "file:../angular-native"
    └── node_modules/lib-e2e-cypress-for-dummys → symlink a ../angular-native
```

---

## Lo que se ha hecho (migración completa, fases 1-9)

### Fase 1-3: Servicios core
- **`PersistenceService`** — IndexedDB via `idb` (stores: tests, interceptors, config)
- **`RecordingService`** — captura clicks/inputs/selects/rutas del DOM, genera comandos Cypress
- **`TranslationService`** — i18n (es/en/fr/it/de)

### Fase 4-5: Servicios avanzados
- **`AdvancedTestTransformationService`** — inserta bloques `it()` y `beforeEach()` en archivos .spec existentes
- **`HttpMonitor`** — parchea `window.fetch` Y `window.XMLHttpRequest` para capturar llamadas HTTP y generar `cy.intercept` + `cy.wait`

### Fase 6: Utils
- **`src/utils/styles.utils.ts`** — `SCROLLBAR_STYLES`, `LIB_E2E_CYPRESS_FOR_DUMMYS_SWAL2_STYLES`, `injectStyles(css, id)`
- **`src/utils/modal.utils.ts`** — `makeModalResizable`, `makeSwalDraggable`, `makeSwalDraggableByContentId`, `setSwal2DataCyAttribute`
- **`src/utils/toast.utils.ts`** — `showToast(message, isSuccess)`

### Fase 7-8: Custom Elements (7 componentes)
Todos usan Shadow DOM (`attachShadow({ mode: 'open' })`), estilos en el shadow, eventos via `CustomEvent`.

| Tag | Clase | Descripción |
|-----|-------|-------------|
| `<lib-e2e-recorder>` | `LibE2eRecorderElement` | Widget principal — barra de herramientas + botón REC |
| `<test-previsualizer>` | `TestPrevisualizerElement` | Lista de comandos + interceptores grabados en tiempo real |
| `<save-test>` | `SaveTestElement` | Modal para nombrar y guardar un test |
| `<test-editor>` | `TestEditorElement` | Lista de tests guardados con expand/delete/copy |
| `<e2e-configuration>` | `ConfigurationElement` | Idioma, HTTP avanzado, export/import JSON |
| `<advanced-test-editor>` | `AdvancedTestEditorElement` | Árbol de archivos e2e + inserción de it() en specs existentes |
| `<file-preview>` | `FilePreviewElement` | Editor de archivo con textarea + save/launch/copy |

### Fase 9: Public API
- **`src/index.ts`** — exporta todo
- **`tsup.config.ts`** — build ESM+CJS, `external: ['idb', 'sweetalert2']`
- **316 tests en verde** (vitest + jsdom + fake-indexeddb)

---

## Estado actual: FUNCIONA en browser

La app de ejemplo (`original/`) arranca con `npm start` y el widget aparece funcionando:
- Grabación de clicks/inputs/selects ✅
- Captura de HTTP (XHR vía Angular HttpClient) ✅
- Modales de Swal2 con componentes inyectados ✅
- Guardado en IndexedDB ✅

### Cómo arrancarlo
```bash
# Terminal 1 — rebuild de la lib en watch
cd angular-native
npm run build:watch

# Terminal 2 — app de ejemplo
cd original
npm start     # ng serve en localhost:4200
```

La relación es via symlink: `original/node_modules/lib-e2e-cypress-for-dummys` → `../angular-native` (instalado con `"file:../angular-native"` en package.json).

---

## Decisiones técnicas importantes

### HttpMonitor parchea AMBOS transportes
Angular 19 `HttpClient` usa XHR por defecto. `withFetch()` causaba errores CORS con mockapi.io. La solución fue parchear `XMLHttpRequest` además de `fetch`:
- `installFetch()` + `installXhr()` en `install()`
- El handler de fetch tiene try-catch defensivo para que errores internos nunca rompan llamadas reales
- El handler de XHR escucha el evento `load` añadiendo listener ANTES de `super.send()`

### SweetAlert2 + Custom Elements (patrón didOpen)
Los modales no son Angular: se usa Swal2 con `didOpen` callback que crea el Custom Element programáticamente e inyecta las propiedades de servicio antes de hacer `appendChild`:
```typescript
didOpen: (popup) => {
  const el = document.createElement('test-previsualizer') as TestPrevisualizerElement;
  el.commands = [...];
  popup.querySelector('.modal-content')!.appendChild(el);
}
```

### DI opcional (no Angular)
Cada componente tiene propiedades públicas para los servicios que se asignan desde fuera. Si no se asignan, `connectedCallback` hace `new PersistenceService()` como fallback:
```typescript
connectedCallback(): void {
  if (!this.persistence) this.persistence = new PersistenceService();
  ...
}
```

### Custom Element registration guard
```typescript
if (!customElements.get('lib-e2e-recorder')) {
  customElements.define('lib-e2e-recorder', LibE2eRecorderElement);
}
```

---

## Siguiente paso: mover `angular-native/` a su propio repositorio

La tarea del nuevo chat es publicar la librería como paquete npm independiente:

1. Crear nuevo repo git para `angular-native/`
2. Configurar CI/CD (GitHub Actions) para `npm publish`
3. Actualizar `original/` para que use el paquete publicado en lugar de `file:../angular-native`
4. Posiblemente: actualizar la versión a `1.0.0` (actualmente `0.1.0`)
5. Publicar documentación / README actualizado

### Lo que NO hay que tocar
- Los 316 tests están todos en verde — no romper
- `HttpMonitor` ya parchea XHR y fetch — no añadir `withFetch()` al app host
- El `CUSTOM_ELEMENTS_SCHEMA` en `app.component.ts` es obligatorio para que Angular no se queje del custom element
- El `import 'lib-e2e-cypress-for-dummys'` en `main.ts` es el único punto de entrada al bundle

---

## Dependencias clave de la librería

```json
{
  "dependencies": {
    "idb": "^8.0.3",        // IndexedDB wrapper
    "sweetalert2": "^11.x"  // Modales
  }
}
```
Ambas son `external` en tsup (no bundleadas, el consumidor las instala).

---

## Tests: cómo correrlos
```bash
cd angular-native
npm test           # vitest run (316 tests)
npm run test:watch # modo watch
npm run build      # tsup → dist/
```

---

## Archivos críticos a conocer

| Archivo | Por qué importa |
|---------|----------------|
| `src/components/lib-e2e-recorder.ts` | Componente raíz, orquesta todo |
| `src/services/http-monitor.ts` | Parcha fetch+XHR, genera cy.intercept/cy.wait |
| `src/services/recording.service.ts` | Captura DOM events, genera comandos Cypress |
| `src/services/persistence.service.ts` | IndexedDB via idb |
| `src/index.ts` | Barrel de exports público |
| `tsup.config.ts` | Configuración de build |
| `specs/http-monitor.spec.ts` | Tests del monitor (incluye FakeXHR para jsdom) |
| `original/src/main.ts` | `import 'lib-e2e-cypress-for-dummys'` — punto de entrada |
| `original/src/app/app.component.ts` | `CUSTOM_ELEMENTS_SCHEMA` — obligatorio |
