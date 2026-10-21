import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import Swal from 'sweetalert2'; // <--- Importar SweetAlert2
import { Reserva, ReservasApiClient } from '../../shared/reservas-api-client';
import { mensajeDeError } from '../../shared/mensaje-error';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    TagModule, 
    TabsModule
  ],
  templateUrl: './mis-turnos.html',
})
export class MisTurnosComponent implements OnInit {
  private reservasApi = inject(ReservasApiClient);
  private messageService = inject(MessageService);
  private router = inject(Router);

  readonly turnos = signal<Reserva[]>([]);
  readonly isLoading = signal(true);

  // Solapa 1: Próximos turnos (activos y cuya fecha sea futura o del día de hoy)
  readonly proximosTurnos = computed(() => {
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    return this.turnos().filter(t => {
      const fechaTurno = new Date(t.fechaHora);
      return t.estado === 'ACTIVO' && fechaTurno >= ahora;
    });
  });

  // Solapa 2: Historial (turnos pasados, atendidos, ausentes o cancelados)
  readonly historialTurnos = computed(() => {
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    return this.turnos().filter(t => {
      const fechaTurno = new Date(t.fechaHora);
      return t.estado !== 'ACTIVO' || fechaTurno < ahora;
    });
  });

  ngOnInit(): void {
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    this.isLoading.set(true);
    this.reservasApi.getMisTurnos().subscribe({
      next: (data) => {
        this.turnos.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar tus turnos',
          detail: mensajeDeError(err),
        });
      },
    });
  }

  // Regla del enunciado: el paciente cancela solo hasta el día anterior a la consulta
  puedeCancelar(turno: Reserva): boolean {
    if (turno.estado !== 'ACTIVO') return false;
    const inicioDelDia = new Date(turno.fechaHora);
    inicioDelDia.setHours(0, 0, 0, 0);
    return new Date() < inicioDelDia;
  }

  confirmarCancelacion(turno: Reserva): void {
    const fechaFormateada = new Date(turno.fechaHora).toLocaleDateString();
    
    Swal.fire({
      title: '¿Cancelar turno?',
      text: `¿Deseas cancelar el turno con Dr/a. ${turno.medico.apellidos}, ${turno.medico.nombres} para el día ${fechaFormateada}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cancelar(turno.id);
      }
    });
  }

  private cancelar(id: number): void {
    this.reservasApi.cancelar(id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Turno cancelado',
          text: 'El turno fue cancelado correctamente.',
          confirmButtonColor: '#10b981',
          timer: 2500,
          timerProgressBar: true,
        });
        this.cargarTurnos();
      },
      error: (err: HttpErrorResponse) => {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo cancelar el turno',
          text: mensajeDeError(err),
          confirmButtonColor: '#ef4444',
        });
      },
    });
  }

  irAReservar(): void {
    this.router.navigate(['/paciente/reservar']);
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
}