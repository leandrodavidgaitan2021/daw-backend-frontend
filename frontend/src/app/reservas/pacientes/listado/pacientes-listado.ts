import { Component, inject, OnInit, signal, WritableSignal } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from "primeng/api";
import { TableModule } from 'primeng/table';
import { ButtonModule } from "primeng/button";
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ReservaResponseDto } from "../../listado/listado-reservas-dto";
import { GestionReservasApiClient } from "../../gestion/gestion-reserva-api-client";
import { Template } from "../../../template/template";
import { GestionReserva } from "../../gestion/gestion-reserva";
import { PacientesListadoApiClient } from "./pacientes-listado-api-client";

@Component({
  selector: "app-pacientes-listado",
  standalone: true,
  templateUrl: "./pacientes-listado.html",
  styleUrls: ["./pacientes-listado.css"],
  imports: [CommonModule, TableModule, ButtonModule, TooltipModule, ConfirmDialogModule, Template, GestionReserva]
})
export class PacientesListado implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly gestionReservasApiClient = inject(GestionReservasApiClient);
  private readonly pacientesListadoApiClient = inject(PacientesListadoApiClient);

  // Signals del listado de turnos del paciente
  reservas: WritableSignal<ReservaResponseDto[]> = signal([]);
  dialogVisible: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.refrescarReservas();
  }

  refrescarReservas(): void {
    this.pacientesListadoApiClient.getMisTurnos().subscribe({
      next: (data) => this.reservas.set(data),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al obtener sus turnos reservados.' });
      }
    });
  }

  nuevaReserva(): void {
    this.dialogVisible.set(true);
  }

  puedeCancelar(fechaHoraStr: string): boolean {
      const fechaTurno = new Date(fechaHoraStr);
      const hoy = new Date();
      
      // Normalizamos ambas fechas a medianoche (00:00:00) para comparar días calendarios limpios
      fechaTurno.setHours(0, 0, 0, 0);
      hoy.setHours(0, 0, 0, 0);

      const diferenciaMs = fechaTurno.getTime() - hoy.getTime();
      const diasDiferencia = diferenciaMs / (1000 * 60 * 60 * 24);

      // Si diasDiferencia es 0, significa que el turno es HOY. 
      // Si es menor a 0, el turno ya pasó.
      // Solo permite cancelar si hay 1 o más días de diferencia (hasta el día anterior).
      return diasDiferencia >= 0;
  }

  cancelarReserva(id: number, fechaHoraStr: string): void {
    if (!this.puedeCancelar(fechaHoraStr)) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Acción no permitida', 
        detail: 'La cancelación de turnos solo está permitida hasta el día anterior a la consulta.' 
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Confirmar cancelación',
      message: '¿Estás seguro de que deseas cancelar este turno?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: () => {
        this.gestionReservasApiClient.cancelarReserva(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Turno cancelado correctamente.' });
            this.refrescarReservas();
          },
          error: (err) => {
            const detail = err?.error?.message || 'No se pudo cancelar el turno.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
          }
        });
      }
    });
  }
}