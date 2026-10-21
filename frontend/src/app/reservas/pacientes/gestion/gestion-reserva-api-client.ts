import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrearReservaDTO, ModificarReservaDto } from './gestion-reserva-dto';
import { ReservaResponseDto } from '../../listado/listado-reservas-dto';

@Injectable({
  providedIn: 'root'
})
export class GestionReservasApiClient {
  private readonly http = inject(HttpClient);
  // Ajusta la ruta base según tu entorno o proxy (ej. '/api/reservas')
  private readonly baseUrl = '/api/reservas';

  crearReserva(dto: CrearReservaDTO): Observable<ReservaResponseDto> {
    return this.http.post<ReservaResponseDto>(this.baseUrl, dto);
  }

  modificarReserva(id: number, dto: ModificarReservaDto): Observable<ReservaResponseDto> {
    return this.http.put<ReservaResponseDto>(`${this.baseUrl}/${id}`, dto);
  }

  cancelarReserva(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/cancelar`, {});
  }

  getHorariosOcupados(idMedico: number, fecha: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/horarios-ocupados`, {
      params: { idMedico: idMedico.toString(), fecha }
    });
  }
}