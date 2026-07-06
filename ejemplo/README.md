# ejemplo — showcase de lib-e2e-cypress-for-dummys

Aplicación de demostración basada en **Module Federation + Vite + Web Components** (cero framework).
Cubre las 18+ áreas de la librería con una guía inline `?→ Cómo activar / Comando esperado`.

## Requisitos

- Node.js ≥ 18
- npm ≥ 10 (workspaces)

## Instalación

```bash
cd ejemplo
npm install
```

### Service Worker de MSW (primera vez)

```bash
npx msw init packages/shell/public --save
```

Esto crea `packages/shell/public/mockServiceWorker.js`.

## Desarrollo

```bash
npm run dev
```

Esto:
1. Compila la librería raíz (`tsup`)
2. Compila los 3 remotes con `vite build`
3. Lanza los remotes en modo preview (puertos 5001 / 5002 / 5003)
4. Lanza el shell en modo dev (puerto **5000**)

Abre http://localhost:5000

## Ports

| App | Puerto | Descripción |
|-----|--------|-------------|
| Shell | 5000 | Entrada principal, router, recorder Opción A |
| mfe-store | 5001 | Tienda — selectores, clicks, HTTP GET, fixtures |
| mfe-forms | 5002 | Checkout — formularios, HTTP POST/PUT/DELETE, Alt+click |
| mfe-admin | 5003 | Panel — sub-rutas, tablas, mat-select-like, IDs de framework |

## Toggle Opción A / Opción B (spec 006)

| URL | Modo | Descripción |
|-----|------|-------------|
| `http://localhost:5000?recorder=shell` | Opción A (defecto) | Un único recorder en el shell |
| `http://localhost:5000?recorder=mfe` | Opción B | Un recorder por MFE |

## Features cubiertas

| # | Feature | App | Sección |
|---|---------|-----|---------|
| 1 | Click | Tienda | §1 |
| 2 | Double-click | Tienda | §1 |
| 3 | Right-click | Tienda | §1 |
| 4 | Selector data-cy | Tienda | §1 |
| 5 | Selector data-testid | Tienda | §2 |
| 6 | Selector aria-label | Tienda | §3 |
| 7 | Selector id limpio | Tienda | §4 |
| 8 | IDs con prefijo framework ignorados | Tienda §4 / Panel §3 | |
| 9 | Smart Selector Picker | Tienda | §5 |
| 10 | `<select>` dropdown | Tienda | §6 |
| 11 | Input text + debounce | Tienda §7 / Checkout §3 | |
| 12 | Enter / Escape | Tienda | §7 |
| 13 | Checkbox | Checkout | §1 |
| 14 | Radio button | Checkout | §2 |
| 15 | Alt+click assertions | Checkout | §7 |
| 16 | HTTP GET spy | Tienda | §8 |
| 17 | HTTP GET fixtures | Tienda | §8 |
| 18 | HTTP POST body validation | Checkout | §4 |
| 19 | HTTP PUT | Checkout | §5 |
| 20 | HTTP DELETE ignorado | Checkout | §6 |
| 21 | Sub-rutas internas | Panel | §1 |
| 22 | Dblclick / rightclick en tabla | Panel | §2 |
| 23 | mat-select-like overlay | Panel | §4 |
| 24 | Navegación SPA (cy.url()) | Shell nav | |
| 25 | Continuidad cross-MFE | Shell + remotes | |
| 26 | Opción A vs B | `?recorder=` | Guía |
| 27 | File panel + Cypress runner | Config ⚙️ | |
| 28 | Import / Export | Config ⚙️ | |
| 29 | Ticket / Issue tracker | Config ⚙️ | |
| 30 | Idioma (5 idiomas) | Config ⚙️ | |

## Cypress

```bash
# Lanzar el runner (desde ejemplo/)
npx cypress open --config-file cypress.config.ts

# O headless
npx cypress run --config-file cypress.config.ts
```

Los fixtures HTTP generados por la librería se guardan en `cypress/fixtures/`.
Los tests de ejemplo están en `cypress/e2e/showcase.cy.ts`.

## Estructura

```
ejemplo/
├── packages/
│   ├── shared/          # Estilos, <feature-card>, MSW handlers, mock data
│   ├── shell/           # Host federation (port 5000)
│   ├── mfe-store/       # Remote — Tienda (port 5001)
│   ├── mfe-forms/       # Remote — Checkout (port 5002)
│   └── mfe-admin/       # Remote — Panel (port 5003)
├── cypress/
│   ├── e2e/             # showcase.cy.ts
│   ├── fixtures/        # Generados por el recorder
│   └── support/
└── cypress.config.ts
```
