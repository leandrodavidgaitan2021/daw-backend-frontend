import { ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';

import { MessageService, ConfirmationService } from 'primeng/api';

// Importaciones necesarias para PrimeNG
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { authInterceptor } from './auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    // Configuración de animaciones y PrimeNG con traducción al Español
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.my-app-dark'
        }
      },
      ripple: true,
      translation: {
        // Nombres completos de los meses en español
        monthNames: [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ],
        // Nombres cortos de los meses
        monthNamesShort: [
          'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ],
        // Días de la semana completos
        dayNames: [
          'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
        ],
        // Días de la semana cortos
        dayNamesShort: [
          'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
        ],
        // Iniciales de los días de la semana
        dayNamesMin: [
          'D', 'L', 'M', 'X', 'J', 'V', 'S'
        ],
        // Primer día de la semana (1 = Lunes, 0 = Domingo)
        firstDayOfWeek: 1,
        // Formato por defecto para el calendario
        dateFormat: 'dd/mm/yy',
        today: 'Hoy',
        clear: 'Limpiar'
      }
    }),
    MessageService,
    ConfirmationService
  ]
};