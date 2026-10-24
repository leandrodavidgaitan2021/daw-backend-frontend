import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MessageService, ConfirmationService } from "primeng/api"; 
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { DatePickerModule } from "primeng/datepicker";
import { ConfirmDialogModule } from "primeng/confirmdialog"; 

import { ReservaResponseDto } from "../../listado/listado-reservas-dto";
import { MedicoTurnosApiClient } from "../gestion/medico-turnos-api-client";
import { Template } from "../../../template/template";
import { AuthStore } from "../../../auth/auth-store";
import { ReservaEstadoService } from "../../../shared/reserva-estado.service";

@Component({
  selector: "app-medicos-turnos",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DatePickerModule,
    Template,
    ConfirmDialogModule, 
  ],
  templateUrl: "./medicos-turnos.html",
  styleUrls: ["./medicos-turnos.css"],
})
export class MedicosTurnos {
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService); 
  private readonly medicosTurnosApiClient = inject(MedicoTurnosApiClient);
  private readonly authStore = inject(AuthStore);
  private readonly reservaEstadoService = inject(ReservaEstadoService);

  selectedDate: WritableSignal<Date> = signal(new Date());
  turnos: WritableSignal<ReservaResponseDto[]> = signal([]);
  isLoading: WritableSignal<boolean> = signal(false);

  constructor() {
    effect(() => {
      this.reservaEstadoService.actualizacionTrigger();
      this.cargarTurnos();
    });
  }

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
      this.messageService.add({
        severity: "warn",
        summary: "Sesión",
        detail: "No se encontró el ID del usuario médico logueado.",
      });
      return;
    }

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const fechaStr = `${anio}-${mes}-${dia}`;

    this.isLoading.set(true);

    this.medicosTurnosApiClient.getTurnosPorFecha(fechaStr).subscribe({
      next: (data) => {
        this.turnos.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar los turnos del día.",
        });
      },
    });
  }

  // 👇 5. Modificar el método para incluir la confirmación interactiva
  cambiarEstado(id: number, nuevoEstado: "ATENDIDO" | "AUSENTE"): void {
    const esAtendido = nuevoEstado === "ATENDIDO";

    this.confirmationService.confirm({
      header: esAtendido ? "Confirmar atención" : "Marcar AUSENTE",
      message: `¿Estás seguro de que deseas marcar este turno como ${nuevoEstado}?`,
      icon: esAtendido ? "pi pi-check-circle" : "pi pi-exclamation-triangle",
      acceptLabel: esAtendido ? "Sí, marcar ATENDIDO" : "Sí, marcar AUSENTE",
      rejectLabel: "Cancelar",
      acceptButtonStyleClass: esAtendido
        ? "p-button-success"
        : "p-button-warning",
      rejectButtonStyleClass: "p-button-secondary p-button-text",
      accept: () => {
        this.medicosTurnosApiClient
          .cambiarEstadoTurno(id, nuevoEstado)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: "success",
                summary: "Estado Actualizado",
                detail: `El turno fue marcado como ${nuevoEstado}.`,
              });

              this.reservaEstadoService.notificarCambio();
              this.cargarTurnos();
            },
            error: (err) => {
              const detail =
                err?.error?.message ||
                "No se pudo actualizar el estado del turno.";
              this.messageService.add({
                severity: "error",
                summary: "Error",
                detail,
              });
            },
          });
      },
    });
  }

  getSeverity(
    estado: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (estado) {
      case "ACTIVO":
        return "info";
      case "ATENDIDO":
        return "success";
      case "AUSENTE":
        return "warn";
      case "CANCELADO":
        return "danger";
      default:
        return "secondary";
    }
  }
}
