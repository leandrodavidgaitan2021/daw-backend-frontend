import { HttpErrorResponse } from '@angular/common/http';
import { mensajeDeError } from '../../shared/mensaje-error';

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicoTurnosApiClient, TurnoMedico } from '../../shared/medico-turnos-api-client';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-medico-turnos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DatePickerModule,
    TagModule
  ],
  templateUrl: './medico-turnos.html',
  styleUrl: './medico-turnos.css'
})
export class MedicoTurnosComponent implements OnInit {
  private medicoTurnosApiClient = inject(MedicoTurnosApiClient);
  private messageService = inject(MessageService);

  readonly turnos = signal<TurnoMedico[]>([]);
  readonly isLoading = signal(false);
  
  selectedDate: Date = new Date();

  ngOnInit(): void {
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    if (!this.selectedDate) return;

    const fechaFormateada = this.formatDateToYYYYMMDD(this.selectedDate);

    this.isLoading.set(true);
    this.medicoTurnosApiClient.getTurnosPorFecha(fechaFormateada).subscribe({
      next: (data) => {
        this.turnos.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar turnos:', err);
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: mensajeDeError(err, 'No se pudieron cargar los turnos para la fecha seleccionada.')
        });
      }
    });
  }

  cambiarEstado(turnoId: number, nuevoEstado: 'ATENDIDO' | 'AUSENTE'): void {
    // Validación adicional de seguridad por si intentan forzarlo
    if (!this.esHoy()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción no permitida',
        detail: 'Solo se pueden modificar turnos correspondientes al día de hoy.'
      });
      return;
    }

    this.medicoTurnosApiClient.actualizarEstadoTurno(turnoId, nuevoEstado).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: `Turno marcado como ${nuevoEstado.toLowerCase()}.`
        });
        this.cargarTurnos();
      },
      error: (err: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: mensajeDeError(err, 'No se pudo actualizar el estado del turno.')
        });
      }
    });
  }

  // NUEVO: Método para verificar si la fecha seleccionada es hoy
  esHoy(): boolean {
    if (!this.selectedDate) return false;
    
    const hoy = new Date();
    const fechaSeleccionada = new Date(this.selectedDate);

    return (
      fechaSeleccionada.getDate() === hoy.getDate() &&
      fechaSeleccionada.getMonth() === hoy.getMonth() &&
      fechaSeleccionada.getFullYear() === hoy.getFullYear()
    );
  }

  getSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'ACTIVO': return 'info';
      case 'ATENDIDO': return 'success';
      case 'AUSENTE': return 'warn';
      case 'CANCELADO': return 'danger';
      default: return 'secondary';
    }
  }

  private formatDateToYYYYMMDD(date: Date | string): string {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}