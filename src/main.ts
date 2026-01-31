import './styles/main.scss';
import { AppComponent } from '@components/app/app.component';

/**
 * Inicializa la aplicación
 */
function main() {
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    console.error('No se encontró el elemento #app en el HTML');
    return;
  }

  // Crear e inicializar el componente principal
  const app = new AppComponent();
  appContainer.appendChild(app.render());
}

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', main);
