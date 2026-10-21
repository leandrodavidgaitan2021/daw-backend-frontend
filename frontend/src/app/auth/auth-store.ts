import { Injectable, computed, signal, inject } from '@angular/core';
import { Router } from "@angular/router";
import { RolUsuario } from './roles.enum';

export type Rol = RolUsuario;

export interface Usuario {
  id: number | string;
  nombres?: string;
  apellidos?: string;
  email: string;
  rol?: string; // Usamos 'rol' tal cual viene de tu API de NestJS
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStore {

  private readonly router: Router = inject(Router)
  // Estado privado con Signals
  private readonly _user = signal<Usuario | null>(this.getUserFromStorage());
  private readonly _token = signal<string | null>(sessionStorage.getItem('token'));

  // Propiedades públicas de solo lectura
  readonly usuario = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  
  // Señal computada para saber si el usuario está autenticado
  readonly isAuthenticated = computed(() => !!this._token());
  // Rol del usuario con sesión iniciada (o null si no hay sesión)
  readonly rol = computed(() => (this._user()?.rol as Rol | undefined) ?? null);
  /**
   * Establece la sesión del usuario guardando el token y sus datos
   */
  setSession(token: string, user: Usuario): void {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  /**
   * Cierra la sesión limpiando el almacenamiento y reseteando las señales
   */
  cerrarSesion(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigateByUrl("/login");
  }

  /**
   * Recupera el usuario almacenado en sessionStorage al iniciar
   */
  private getUserFromStorage(): Usuario | null {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error al parsear el usuario del sessionStorage', e);
        return null;
      }
    }
    return null;
  }
}