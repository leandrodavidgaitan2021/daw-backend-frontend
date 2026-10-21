import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservaResponseDto } from '../../listado/listado-reservas-dto';

@Injectable({
  providedIn: 'root'
})
export class PacientesListadoApiClient {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/reservas';

  // Obtiene exclusivamente los turnos del paciente logueado actual
  getMisTurnos(): Observable<ReservaResponseDto[]> {
    return this.http.get<ReservaResponseDto[]>(`${this.apiUrl}/paciente`);
  }
}