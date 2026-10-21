import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EstadosReservas } from '../reservas/estados-reservas-enum';


export interface Medico {
  id: number;
  matricula: number;
  valorConsulta: number;
  nombres: string;
  apellidos: string;
}
// Misma forma que el ReservaResponseDto del backend
export interface Reserva {
  id: number;
  fechaHora: string;
  estado: EstadosReservas;
  valorConsulta: number;
  paciente: { id: number; nombres: string; apellidos: string; documento: string; email: string };
  medico: { id: number; matricula: number; valorConsulta: number; nombres: string; apellidos: string };
}

// Datos que se envían para reservar un turno
export interface CrearReservaRequest {
  idMedico: number;
  idPaciente?: number; // solo lo indica el administrador
  fechaHora: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservasApiClient {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/reservas';

  getMisTurnos(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/paciente`);
  }

  getTodas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(this.apiUrl);
  }

  getMedicos(): Observable<Medico[]> {
    return this.http.get<Medico[]>('/api/medicos');
  }

  
getHorariosOcupados(idMedico: number, fecha: string): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/disponibilidad`, {
    params: {
      idMedico: idMedico.toString(),
      fecha: fecha,
    },
  });
}



  crear(datos: CrearReservaRequest): Observable<Reserva> {
    return this.http.post<Reserva>(this.apiUrl, datos);
  }

  cancelar(id: number): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}