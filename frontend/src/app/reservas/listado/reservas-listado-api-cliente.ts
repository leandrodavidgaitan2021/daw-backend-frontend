import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservaResponseDto } from './listado-reservas-dto'; // O la ruta correcta de tus DTOs

@Injectable({
  providedIn: 'root'
})
export class ReservasListadoApiClient {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/reservas';

  // Método requerido por el componente ReservasListado para la tabla principal
  getTodas(): Observable<ReservaResponseDto[]> {
    return this.http.get<ReservaResponseDto[]>(this.apiUrl);
  }

  // Si necesitas listar específicamente los turnos del paciente logueado
  //getMisTurnos(): Observable<ReservaResponseDto[]> {
  //  return this.http.get<ReservaResponseDto[]>(`${this.apiUrl}/paciente`);
  //}
}