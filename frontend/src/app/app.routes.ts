import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { ReservasListado } from './reservas/listado/reservas-listado';
import { PacientesListado } from './reservas/pacientes/listado/pacientes-listado';
import { MedicosTurnos } from './reservas/medicos/listado/medicos-turnos';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  // Ruta para Administradores / Médicos (según corresponda)
  { 
    path: 'reservas', 
    component: ReservasListado, 
    canActivate: [authGuard] 
  },

  // Nueva ruta exclusiva para el flujo de Pacientes
  { 
    path: 'pacientes/reservas', 
    component: PacientesListado, 
    canActivate: [authGuard] 
  },

  // Dentro de las rutas:
  { 
    path: 'medicos/turnos', 
    component: MedicosTurnos, 
    canActivate: [authGuard] 
  },

  { path: '**', redirectTo: 'login' }
];