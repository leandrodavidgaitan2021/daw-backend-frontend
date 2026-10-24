import {
  Component,
  computed,
  inject,
  model,
  ModelSignal,
  output,
  Signal,
  signal,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { MessageService, ConfirmationService } from "primeng/api";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { DatePickerModule } from "primeng/datepicker";
import { SelectModule } from "primeng/select";
import { ConfirmDialogModule } from "primeng/confirmdialog";

import {
  ReservaResponseDto,
  MedicoResponseDto,
  UsuarioResponseDto,
} from "../listado/listado-reservas-dto";
import { GestionReservasApiClient } from "./gestion-reserva-api-client";
import { CrearReservaDTO } from "./crear-reserva-dto";
import { AuthStore } from "../../auth/auth-store";
import { ReservaEstadoService } from "../../shared/reserva-estado.service";

@Component({
  selector: "app-reservas-gestion",
  standalone: true,
  templateUrl: "./gestion-reserva.html",
  styleUrls: ["./gestion-reserva.css"],
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    ConfirmDialogModule,
  ],
})
export class GestionReserva {
  visible: ModelSignal<boolean> = model(false);
  reservaSeleccionada: ModelSignal<ReservaResponseDto | null> =
    model<ReservaResponseDto | null>(null);

  // Output moderno para notificar al componente padre que se guardó una reserva
  readonly reservaGuardada = output<void>();

  // Definición de la propiedad header requerida por la plantilla [header]="header()"
  header: Signal<string> = computed(() => {
    if (this.reservaSeleccionada()) {
      return "Editar Reserva";
    }
    return this.esAdministrador()
      ? "Asignar Turno (Administrador)"
      : "Reservar Turno";
  });

  private readonly messageService: MessageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly gestionReservasApiClient = inject(GestionReservasApiClient);
  private readonly reservaEstadoService = inject(ReservaEstadoService);
  readonly authStore = inject(AuthStore);

  private solicitudDisponibilidad = 0;

  readonly medicos = signal<MedicoResponseDto[]>([]);
  readonly pacientes = signal<UsuarioResponseDto[]>([]);
  readonly medicoSeleccionado = signal<number | null>(null);
  readonly pacienteSeleccionado = signal<number | null>(null);
  readonly fechaSeleccionada = signal<Date | null>(null);
  readonly horaSeleccionada = signal<string | null>(null);

  readonly guardando = signal(false);
  readonly cargandoMedicos = signal(false);
  readonly cargandoPacientes = signal(false);
  readonly horariosOcupados = signal<string[]>([]);
  readonly cargandoDisponibilidad = signal(false);

  readonly horarios = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
  ];

  readonly fechaMinima = this.inicioDelDia(new Date());

  constructor() {
    // 1. Efecto automático: Cada vez que se abre el modal, refrescamos médicos y pacientes
    effect(() => {
      if (this.visible()) {
        this.cargarMedicos();
        if (this.esAdministrador()) {
          this.cargarPacientes();
        }
      }
    });

    // 2. Efecto automático: Detecta cambios en el médico o la fecha para recalcular la disponibilidad en tiempo real
    effect(() => {
      const idMedico = this.medicoSeleccionado();
      const fecha = this.fechaSeleccionada();

      this.ejecutarCargaDisponibilidad(idMedico, fecha);
    });
  }

  esAdministrador(): boolean {
    return this.authStore.usuario()?.rol === "ADMINISTRADOR";
  }

  cargarMedicos(): void {
    this.cargandoMedicos.set(true);
    this.gestionReservasApiClient.getMedicos().subscribe({
      next: (data) => {
        this.medicos.set(data);
        this.reservaEstadoService.notificarCambio();
        this.cargandoMedicos.set(false);
      },
      error: () => {
        this.cargandoMedicos.set(false);
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar los médicos",
        });
      },
    });
  }

  cargarPacientes(): void {
    this.cargandoPacientes.set(true);
    this.gestionReservasApiClient.getUsuarios().subscribe({
      next: (data) => {
        this.pacientes.set(data);
        this.cargandoPacientes.set(false);
      },
      error: () => {
        this.cargandoPacientes.set(false);
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "No se pudieron cargar los pacientes",
        });
      },
    });
  }

  cambioMedico(id: number | null): void {
    this.medicoSeleccionado.set(id);
    this.horaSeleccionada.set(null);
  }

  cambioFecha(fecha: Date | null): void {
    this.fechaSeleccionada.set(fecha);
    this.horaSeleccionada.set(null);
  }

  private ejecutarCargaDisponibilidad(
    idMedico: number | null,
    fecha: Date | null,
  ): void {
    const solicitud = ++this.solicitudDisponibilidad;
    this.horariosOcupados.set([]);

    if (idMedico === null || !fecha) {
      this.cargandoDisponibilidad.set(false);
      return;
    }

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const fechaConsulta = `${anio}-${mes}-${dia}`;

    this.cargandoDisponibilidad.set(true);

    this.gestionReservasApiClient
      .getHorariosOcupados(idMedico, fechaConsulta)
      .subscribe({
        next: (horarios) => {
          if (solicitud !== this.solicitudDisponibilidad) return;
          this.horariosOcupados.set(horarios);
          this.cargandoDisponibilidad.set(false);
        },
        error: () => {
          if (solicitud !== this.solicitudDisponibilidad) return;
          this.cargandoDisponibilidad.set(false);
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "No se pudo consultar la disponibilidad",
          });
        },
      });
  }

  horarioOcupado(hora: string): boolean {
    return this.horariosOcupados().includes(hora);
  }

  guardarReserva(): void {
    const medicoId = this.medicoSeleccionado();
    const fecha = this.fechaSeleccionada();
    const hora = this.horaSeleccionada();
    const pacienteId = this.pacienteSeleccionado();

    if (this.esAdministrador() && !pacienteId) {
      this.messageService.add({
        severity: "warn",
        summary: "Falta paciente",
        detail: "Debe seleccionar un paciente para asignarle el turno.",
      });
      return;
    }

    if (medicoId === null || !fecha || !hora) {
      this.messageService.add({
        severity: "warn",
        summary: "Faltan datos",
        detail: "Seleccioná un médico, una fecha y un horario.",
      });
      return;
    }

    const [horas, minutos] = hora.split(":").map(Number);
    const fechaHora = new Date(fecha);
    fechaHora.setHours(horas, minutos, 0, 0);

    if (fechaHora <= new Date()) {
      this.messageService.add({
        severity: "warn",
        summary: "Horario no válido",
        detail: "Seleccioná una fecha y hora futuras.",
      });
      return;
    }

    const medicoObj = this.medicos().find((m) => m.id === medicoId);
    const fechaFormateada = fecha.toLocaleDateString();

    this.confirmationService.confirm({
      key: "reservaDialog", // 👈 Asociamos la clave aquí
      header: "Confirmar reserva",
      message: `¿Deseas confirmar el turno con el/la Dr/a. ${medicoObj?.apellidos} para el día ${fechaFormateada} a las ${hora} hs?`,
      icon: "pi pi-question-circle",
      acceptLabel: "Sí, confirmar",
      rejectLabel: "Cancelar",
      acceptButtonStyleClass: "p-button-success",
      rejectButtonStyleClass: "p-button-secondary p-button-text",
      accept: () => {
        const datos: CrearReservaDTO = {
          idMedico: medicoId,
          fechaHora: fechaHora.toISOString(),
          ...(this.esAdministrador() && pacienteId
            ? { idPaciente: pacienteId }
            : {}),
        };

        this.guardando.set(true);

        this.gestionReservasApiClient.crearReserva(datos).subscribe({
          next: () => {
            this.guardando.set(false);
            this.messageService.add({
              severity: "success",
              summary: "¡Turno Reservado!",
              detail: "La reserva se registró correctamente en el sistema.",
            });
            this.reservaEstadoService.notificarCambio();
            this.reservaGuardada.emit();
            this.cerrarDialog();
          },
          error: (err: HttpErrorResponse) => {
            this.guardando.set(false);
            this.messageService.add({
              severity: "error",
              summary: "Error al reservar",
              detail: err?.error?.message || "Ocurrió un error inesperado.",
            });
          },
        });
      },
      reject: () => {
        // Cancelado
      },
    });
  }

  cerrarDialog(): void {
    this.reservaSeleccionada.set(null);
    this.medicoSeleccionado.set(null);
    this.pacienteSeleccionado.set(null);
    this.fechaSeleccionada.set(null);
    this.horaSeleccionada.set(null);
    this.horariosOcupados.set([]);
    this.visible.set(false);
  }

  private inicioDelDia(fecha: Date): Date {
    const resultado = new Date(fecha);
    resultado.setHours(0, 0, 0, 0);
    return resultado;
  }
}
