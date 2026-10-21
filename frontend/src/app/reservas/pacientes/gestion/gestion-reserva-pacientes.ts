import { Component, inject, model, ModelSignal, output, signal } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from "primeng/api";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

import { MedicoResponseDto } from "../../listado/listado-medicos-dto";
import { MedicosListadoApiClient } from "../../listado/medicos-listado-api-cliente";
import { GestionReservasApiClient } from "../../gestion/gestion-reserva-api-client";
import { CrearReservaDTO } from "./gestion-reserva-dto";

@Component({
  selector: "app-gestion-reserva-paciente",
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, SelectModule, DatePickerModule],
  templateUrl: "./gestion-reserva-paciente.html",
  styleUrls: ["./gestion-reserva-paciente.css"]
})
export class GestionReservaPaciente {
  visible: ModelSignal<boolean> = model(false);
  readonly reservaGuardada = output<void>();

  private readonly messageService = inject(MessageService);
  private readonly medicosApiClient = inject(MedicosListadoApiClient);
  private readonly gestionReservasApiClient = inject(GestionReservasApiClient);

  // Listas y selecciones
  medicos = signal<MedicoResponseDto[]>([]);
  medicoSeleccionado = signal<MedicoResponseDto | null>(null);
  fechaSeleccionada = signal<Date | null>(null);
  horaSeleccionada = signal<string | null>(null);
  guardando = signal(false);

  // Restricciones de fecha (hoy hasta 30 días máximos)
  readonly fechaMinima = new Date();
  readonly fechaMaxima = new Date();

  // Horarios fijos de atención (8hs a 15hs para turnos de 1 hora)[cite: 2]
  readonly horasDisponibles = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'
  ];

  horariosOcupados = signal<string[]>([]);

  constructor() {
    // Configurar máximo 30 días a futuro por regla de negocio[cite: 2]
    this.fechaMaxima.setDate(this.fechaMinima.getDate() + 30);
    this.cargarMedicos();
  }

  cargarMedicos(): void {
    this.medicosApiClient.getMedicos().subscribe({
      next: (data) => this.medicos.set(data),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los médicos.' })
    });
  }

  onMedicoOFechaChange(): void {
    const medico = this.medicoSeleccionado();
    const fecha = this.fechaSeleccionada();

    if (medico && fecha) {
      // Formatear fecha local YYYY-MM-DD sin desfase UTC
      const anio = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      const fechaStr = `${anio}-${mes}-${dia}`;

      this.gestionReservasApiClient.getHorariosOcupados(medico.id, fechaStr).subscribe({
        next: (ocupados) => this.horariosOcupados.set(ocupados),
        error: () => this.horariosOcupados.set([])
      });
    } else {
      this.horariosOcupados.set([]);
    }
  }

  guardar(): void {
    const medico = this.medicoSeleccionado();
    const fecha = this.fechaSeleccionada();
    const hora = this.horaSeleccionada();

    if (!medico || !fecha || !hora) {
      this.messageService.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Debe seleccionar médico, fecha y hora.' });
      return;
    }

    // Armar fechaHora en formato ISO local
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaHoraIso = `${anio}-${mes}-${dia}T${hora}:00`;

    const dto: CrearReservaDTO = {
      idMedico: medico.id,
      fechaHora: fechaHoraIso
    };

    this.guardando.set(true);
    this.gestionReservasApiClient.crearReserva(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.messageService.add({ severity: 'success', summary: '¡Éxito!', detail: 'Turno reservado correctamente.' });
        this.reservaGuardada.emit();
        this.cerrar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo reservar el turno.' });
      }
    });
  }

  cerrar(): void {
    this.medicoSeleccionado.set(null);
    this.fechaSeleccionada.set(null);
    this.horaSeleccionada.set(null);
    this.horariosOcupados.set([]);
    this.visible.set(false);
  }
}