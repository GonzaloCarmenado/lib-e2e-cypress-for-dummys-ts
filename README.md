# E2E Cypress for Dummys - TypeScript Project

Migración del proyecto Angular a **TypeScript puro** con **Bootstrap** y **Lit Web Components**.

## 🎯 Tecnologías

- **TypeScript** - Lenguaje tipado
- **Vite** - Bundler moderno y rápido
- **Bootstrap 5** - Framework CSS
- **Lit** - Web Components reactivos
- **RxJS** - Reactividad (opcional, pero disponible)
- **Axios** - Cliente HTTP
- **Cypress** - Tests E2E

## 🚀 Inicio Rápido

### Instalación

```bash
# Instalar dependencias
npm install

# Compilar tipos (opcional)
npm run typecheck
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Se abrirá automáticamente en http://localhost:5173
```

### Build

```bash
# Compilar para producción
npm run build

# Los archivos se generan en la carpeta dist/
```

### Preview

```bash
# Previsualizar build de producción
npm run preview
```

## 📂 Estructura del Proyecto

```
ts/
├── src/
│   ├── components/          # Web Components
│   │   └── app/
│   │       └── app.component.ts
│   ├── services/            # Servicios de negocio
│   ├── styles/              # Estilos SCSS
│   │   └── main.scss        # Entrada de estilos con Bootstrap
│   ├── lib/                 # Utilerías y librerías
│   ├── assets/              # Imágenes, fuentes, etc.
│   ├── index.html           # HTML principal
│   └── main.ts              # Punto de entrada
├── vite.config.ts           # Configuración Vite
├── tsconfig.json            # Configuración TypeScript
└── package.json
```

## 🎨 Componentes Bootstrap

Bootstrap está completamente integrado. Puedes usar todas las clases:

```html
<!-- Navbar -->
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  ...
</nav>

<!-- Cards -->
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Título</h5>
    <p class="card-text">Contenido</p>
  </div>
</div>

<!-- Buttons -->
<button class="btn btn-primary">Botón</button>

<!-- Forms -->
<form>
  <div class="mb-3">
    <label for="inputEmail" class="form-label">Email</label>
    <input type="email" class="form-control" id="inputEmail">
  </div>
</form>
```

## 📝 Crear Componentes Web

Usa Lit para crear componentes reactivos:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-component')
export class MyComponent extends LitElement {
  @property() message = 'Hola';

  render() {
    return html`<p>${this.message}</p>`;
  }

  static styles = css`
    p { color: blue; }
  `;
}
```

## 🧪 Tests

### Cypress (E2E)

```bash
npm run cypress       # Abrir Cypress UI
npm run cypress:run   # Ejecutar en headless
```

### Vitest (Unit)

```bash
npm run test
```

## ✅ Checklist de Migración Realizado

- ✅ Estructura TypeScript configurada
- ✅ Vite como bundler
- ✅ Bootstrap 5 integrado
- ✅ Lit Web Components preparados
- ✅ SCSS con alias de rutas
- ✅ ESLint configurado
- ✅ Cypress listo

## 📚 Próximos Pasos

1. **Migrar Servicios** - Convertir servicios Angular a clases TypeScript
2. **Crear Componentes** - Migrar componentes Angular a Web Components
3. **Sistema de Rutas** - Implementar enrutador
4. **Tests** - Actualizar tests Cypress si es necesario
5. **Build** - Optimizar para producción

## 🔗 Recursos

- [Vite Docs](https://vitejs.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Bootstrap Docs](https://getbootstrap.com/)
- [Lit Docs](https://lit.dev/)
- [Cypress Docs](https://docs.cypress.io/)

## 📄 Licencia

MIT
