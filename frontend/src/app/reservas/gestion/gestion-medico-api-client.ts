import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MedicoResponseDto } from '../listado/listado-medicos-dto';
import { ModificarValorConsultaDto } from './modificar-valor-consulta-dto';

@Injectable({
  providedIn: 'root'
})
export class GestionMedicoApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/medicos'; // Ajusta la URL según tu entorno de NestJS

  /**
   * Obtiene el listado público de todos los médicos.
   */
  getMedicos(): Observable<MedicoResponseDto[]> {
    return this.http.get<MedicoResponseDto[]>(this.baseUrl);
  }

  /**
   * Obtiene la información de un médico por su ID.
   * @param id ID único del médico (number o string)
   */
  getMedicoPorId(id: number | string): Observable<MedicoResponseDto> {
    return this.http.get<MedicoResponseDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Modifica el valor de la consulta de un médico específico.
   * @param id ID único del médico
   * @param dto DTO con el nuevo valor de la consulta
   */
  actualizarValorConsulta(id: number | string, dto: ModificarValorConsultaDto): Observable<MedicoResponseDto> {
    return this.http.patch<MedicoResponseDto>(`${this.baseUrl}/${id}/valor-consulta`, dto);
  }
}