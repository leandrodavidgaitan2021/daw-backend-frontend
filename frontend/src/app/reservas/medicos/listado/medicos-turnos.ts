import { Component, inject, OnInit, signal, WritableSignal } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from "primeng/api";
import { TableModule } from 'primeng/table';
import { ButtonModule } from "primeng/button";
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';

import { ReservaResponseDto } from "../../listado/listado-reservas-dto";
import { MedicoTurnosApiClient } from "../gestion/medico-turnos-api-client";
import { Template } from "../../../template/template";
import { AuthStore } from "../../../auth/auth-store";

@Component({
  selector: "app-medicos-turnos",
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, DatePickerModule, Template],
  templateUrl: "./medicos-turnos.html",
  styleUrls: ["./medicos-turnos.css"]
})
export class MedicosTurnos implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly medicosTurnosApiClient = inject(MedicoTurnosApiClient);
  private readonly authStore = inject(AuthStore);

  // Fecha seleccionada (por defecto el día de hoy)
  selectedDate: WritableSignal<Date> = signal(new Date());
  turnos: WritableSignal<ReservaResponseDto[]> = signal([]);
  isLoading: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.cargarTurnos();
  }

  // Valida si la fecha seleccionada corresponde al día de hoy para habilitar las acciones
  esHoy(): boolean {
    const fechaSel = new Date(this.selectedDate());
    const hoy = new Date();
    return (
      fechaSel.getDate() === hoy.getDate() &&
      fechaSel.getMonth() === hoy.getMonth() &&
      fechaSel.getFullYear() === hoy.getFullYear()
    );
  }

  cargarTurnos(): void {
    const fecha = this.selectedDate();
    const usuarioActual = this.authStore.usuario();

    if (!fecha || !usuarioActual?.id) {
      this.messageService.add({ severity: 'warn', summary: 'Sesión', detail: 'No se encontró el ID del usuario médico logueado.' });
      return;
    }

    // Formatear a YYYY-MM-DD local sin desfases UTC
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${anio}-${mes}-${dia}`;

    this.isLoading.set(true);
// Pasamos el id del usuario y la fecha
    this.medicosTurnosApiClient.getTurnosPorFecha(fechaStr).subscribe({
      next: (data) => {
        this.turnos.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los turnos del día.' });
      }
    });
  }

  cambiarEstado(id: number, nuevoEstado: 'ATENDIDO' | 'AUSENTE'): void {
    this.medicosTurnosApiClient.cambiarEstadoTurno(id, nuevoEstado).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Estado Actualizado', 
          detail: `El turno fue marcado como ${nuevoEstado.toLowerCase()}.` 
        });
        this.cargarTurnos();
      },
      error: (err) => {
        const detail = err?.error?.message || 'No se pudo actualizar el estado del turno.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      }
    });
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