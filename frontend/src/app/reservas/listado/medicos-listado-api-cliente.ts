import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MedicoResponseDto } from './listado-medicos-dto';

@Injectable({
  providedIn: 'root'
})
export class MedicosListadoApiClient {
  private readonly http = inject(HttpClient);
  // Ajusta la ruta base de la API según tu backend de NestJS para médicos
  private readonly baseUrl = '/api/medicos';

  /**
   * Obtiene el listado de todos los médicos registrados.
   */
  getMedicos(): Observable<MedicoResponseDto[]> {
    return this.http.get<MedicoResponseDto[]>(this.baseUrl);
  }
}