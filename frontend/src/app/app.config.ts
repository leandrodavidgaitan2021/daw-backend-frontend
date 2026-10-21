import { ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // <-- 1. Importar HttpClient e interceptores

import { routes } from './app.routes';

import { MessageService, ConfirmationService } from 'primeng/api';

// Importaciones necesarias para PrimeNG
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura'; // O puedes usar Lara, Material, Nora
// Importar tu nuevo interceptor
import { authInterceptor } from './auth/auth-interceptor'; // <-- Importar el interceptor

export const appConfig: ApplicationConfig = {
  providers: [
    
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // 3. Registrar HttpClient y habilitar el interceptor aquí
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    // Configuración de animaciones y PrimeNG
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.my-app-dark' // Opcional para manejo de modo oscuro
        }
      },
      ripple: true // Opcional: activa el efecto ripple en botones y componentes
    }),
    MessageService,       // <-- Proveedor global de mensajes
    ConfirmationService   // <-- Proveedor global de confirmaciones
  ]
};
