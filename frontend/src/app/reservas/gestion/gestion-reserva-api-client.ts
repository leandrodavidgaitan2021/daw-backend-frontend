import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservaResponseDto, MedicoResponseDto, UsuarioResponseDto } from '../listado/listado-reservas-dto';
import { CrearReservaDTO } from './crear-reserva-dto';

@Injectable({
  providedIn: 'root'
})
export class GestionReservasApiClient {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/reservas';
  private readonly medicosUrl = '/api/medicos';
  private readonly usuariosUrl = '/api/usuarios/pacientes';

  // Obtener listado de médicos disponibles para el selector
  getMedicos(): Observable<MedicoResponseDto[]> {
    return this.http.get<MedicoResponseDto[]>(this.medicosUrl);
  }

  // Crear una nueva reserva / turno
  crearReserva(datos: CrearReservaDTO): Observable<ReservaResponseDto> {
    return this.http.post<ReservaResponseDto>(this.apiUrl, datos);
  }

  getUsuarios(): Observable<UsuarioResponseDto[]> {
    return this.http.get<UsuarioResponseDto[]>(this.usuariosUrl);
  }

  // Obtener horarios ocupados de un médico en una fecha dada (YYYY-MM-DD)
  getHorariosOcupados(idMedico: number, fecha: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/disponibilidad`, {
      params: {
        idMedico: idMedico.toString(),
        fecha: fecha,
      },
    });
  }

  // Cancelar una reserva
  cancelarReserva(id: number): Observable<ReservaResponseDto> {
    return this.http.patch<ReservaResponseDto>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}