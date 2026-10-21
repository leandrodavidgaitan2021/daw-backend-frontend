import { Component, inject, OnInit, signal, WritableSignal } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from "primeng/api";
import { TableModule } from 'primeng/table';
import { ButtonModule } from "primeng/button";
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog'; // <-- Importante

import { ReservaResponseDto } from "./listado-reservas-dto";
import { ReservasListadoApiClient } from "./reservas-listado-api-cliente";
import { GestionReservasApiClient } from "../gestion/gestion-reserva-api-client";
import { Template } from "../../template/template";
import { GestionReserva } from "../gestion/gestion-reserva";
import { MedicosListado } from "./medicos-listado";

@Component({
  selector: "app-reservas-listado",
  standalone: true,
  templateUrl: "./reservas-listado.html",
  styleUrls: ["./reservas-listado.css"],
  imports: [CommonModule, TableModule, ButtonModule, TooltipModule, ConfirmDialogModule, Template, GestionReserva, MedicosListado],
  providers: [ConfirmationService] // <-- Proveedor local del servicio de confirmación
})
export class ReservasListado implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService); // <-- Inyección del servicio
  private readonly reservasListadoApiClient = inject(ReservasListadoApiClient);
  private readonly gestionReservasApiClient = inject(GestionReservasApiClient);

  // Control de la barra de navegación de vistas ('reservas' o 'medicos')
  readonly vistaActual = signal<'reservas' | 'medicos'>('reservas');

  // Signals exclusivas de Reservas
  reservas: WritableSignal<ReservaResponseDto[]> = signal([]);
  dialogVisible: WritableSignal<boolean> = signal(false);
  reservaSeleccionada: WritableSignal<ReservaResponseDto | null> = signal<ReservaResponseDto | null>(null);

  ngOnInit(): void {
    this.refrescarReservas();
  }

  cambiarVista(vista: 'reservas' | 'medicos'): void {
    this.vistaActual.set(vista);
    
    // Si el usuario cambia a la pestaña de reservas, forzamos la búsqueda de inmediato
    if (vista === 'reservas') {
      this.refrescarReservas();
    }
  }

  refrescarReservas(): void {
    this.reservasListadoApiClient.getTodas().subscribe({
      next: (data) => this.reservas.set(data),
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al obtener las reservas' });
      }
    });
  }

  crearReserva(): void {
    this.reservaSeleccionada.set(null);
    this.dialogVisible.set(true);
  }

  cancelarReserva(id: number): void {
    // Cuadro de confirmación nativo de PrimeNG
    this.confirmationService.confirm({
      header: 'Confirmar cancelación',
      message: '¿Estás seguro de que deseas cancelar este turno?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar turno',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: () => {
        this.gestionReservasApiClient.cancelarReserva(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva cancelada correctamente.' });
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