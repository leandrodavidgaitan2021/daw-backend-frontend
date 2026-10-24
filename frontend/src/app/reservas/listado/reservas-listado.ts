import { Component, inject, OnInit, signal, WritableSignal, effect, computed, Signal } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MessageService, ConfirmationService } from "primeng/api";
import { TableModule } from 'primeng/table';
import { ButtonModule } from "primeng/button";
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ReservaResponseDto } from "./listado-reservas-dto";
import { ReservasListadoApiClient } from "./reservas-listado-api-cliente";
import { GestionReservasApiClient } from "../gestion/gestion-reserva-api-client";
import { Template } from "../../template/template";
import { GestionReserva } from "../gestion/gestion-reserva";
import { MedicosListado } from "./medicos-listado";
import { ReservaEstadoService } from "../../shared/reserva-estado.service";

@Component({
  selector: "app-reservas-listado",
  standalone: true,
  templateUrl: "./reservas-listado.html",
  styleUrls: ["./reservas-listado.css"],
  imports: [CommonModule, TableModule, ButtonModule, TooltipModule, ConfirmDialogModule, Template, GestionReserva, MedicosListado],
  providers: [ConfirmationService]
})
export class ReservasListado {
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly reservasListadoApiClient = inject(ReservasListadoApiClient);
  private readonly gestionReservasApiClient = inject(GestionReservasApiClient);
  private readonly reservaEstadoService = inject(ReservaEstadoService);

  // Control de la barra de navegación de vistas ('reservas' o 'medicos')
  readonly vistaActual = signal<'reservas' | 'medicos'>('reservas');

  // Control de filtro interno para la pestaña de reservas: 'proximos' (desde hoy) u 'historial' (pasados)
  readonly filtroHistorial = signal<'proximos' | 'historial'>('proximos');

  // Signals de Reservas (bruto)
  private reservasRaw: WritableSignal<ReservaResponseDto[]> = signal([]);
  
  // Propiedad computada que filtra dinámicamente según lo que elija el usuario
  readonly reservas: Signal<ReservaResponseDto[]> = computed(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const lista = this.reservasRaw();
    const filtro = this.filtroHistorial();

    if (filtro === 'proximos') {
      // Turnos desde hoy en adelante
      return lista.filter(reserva => new Date(reserva.fechaHora) >= hoy);
    } else {
      // Historial: Turnos estrictamente anteriores a hoy
      return lista.filter(reserva => new Date(reserva.fechaHora) < hoy);
    }
  });

  dialogVisible: WritableSignal<boolean> = signal(false);
  reservaSeleccionada: WritableSignal<ReservaResponseDto | null> = signal<ReservaResponseDto | null>(null);

  constructor() {
    effect(() => {
        this.reservaEstadoService.actualizacionTrigger();
        this.refrescarReservas();
    });
  }

  cambiarVista(vista: 'reservas' | 'medicos'): void {
    this.vistaActual.set(vista);
    if (vista === 'reservas') {
      this.refrescarReservas();
    }
  }

  cambiarFiltroHistorial(filtro: 'proximos' | 'historial'): void {
    this.filtroHistorial.set(filtro);
  }

  refrescarReservas(): void {
    this.reservasListadoApiClient.getTodas().subscribe({
      next: (data) => this.reservasRaw.set(data),
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
            this.reservaEstadoService.notificarCambio();
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