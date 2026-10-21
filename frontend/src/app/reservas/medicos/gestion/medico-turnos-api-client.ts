import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservaResponseDto } from '../../listado/listado-reservas-dto';

@Injectable({
  providedIn: 'root'
})
export class MedicoTurnosApiClient {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/medicos/turnos'; // <-- Ruta exacta del backend

  // Obtiene los turnos del médico logueado enviando únicamente la fecha por query params
  getTurnosPorFecha(fecha: string): Observable<ReservaResponseDto[]> {
    return this.http.get<ReservaResponseDto[]>(this.apiUrl, {
      params: { fecha }
    });
  }

  cambiarEstadoTurno(id: number, estado: 'ATENDIDO' | 'AUSENTE'): Observable<ReservaResponseDto> {
    return this.http.patch<ReservaResponseDto>(`${this.apiUrl}/${id}/estado`, { estado });
  }
}