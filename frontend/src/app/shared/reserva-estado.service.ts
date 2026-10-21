import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReservaEstadoService {
  // Un disparador reactivo global
  readonly actualizacionTrigger = signal<number>(0);

  notificarCambio(): void {
    this.actualizacionTrigger.update(v => v + 1);
  }
}