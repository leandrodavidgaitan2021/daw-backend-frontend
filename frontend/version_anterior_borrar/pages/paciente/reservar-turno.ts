import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import Swal from 'sweetalert2'; // <--- Importar SweetAlert2
import {
  ReservasApiClient,
  CrearReservaRequest,
  Medico,
} from '../../shared/reservas-api-client';
import { PacientesApiClient, Paciente } from '../../shared/pacientes-api-client';
import { AuthStore } from '../../../auth/auth-store';
import { mensajeDeError } from '../../shared/mensaje-error';

@Component({
  selector: 'app-reservar-turno',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
  ],
  templateUrl: './reservar-turno.html',
})
export class ReservarTurnoComponent implements OnInit {
  private reservasApi = inject(ReservasApiClient);
  private pacientesApi = inject(PacientesApiClient);
  private messageService = inject(MessageService);
  private router = inject(Router);
  readonly authStore = inject(AuthStore);
  
  private solicitudDisponibilidad = 0;

  readonly medicos = signal<Medico[]>([]);
  readonly pacientes = signal<Paciente[]>([]);
  readonly medicoSeleccionado = signal<number | null>(null);
  readonly pacienteSeleccionado = signal<number | null>(null);
  readonly fechaSeleccionada = signal<Date | null>(null);
  readonly horaSeleccionada = signal<string | null>(null);
  
  readonly guardando = signal(false);
  readonly cargandoMedicos = signal(false);
  readonly cargandoPacientes = signal(false);
  readonly horariosOcupados = signal<string[]>([]);
  readonly cargandoDisponibilidad = signal(false);
  readonly errorDisponibilidad = signal(false);

  readonly horarios = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
  ];

  readonly fechaMinima = this.inicioDelDia(new Date());

  ngOnInit(): void {
    this.cargarMedicos();
    if (this.esAdministrador()) {
      this.cargarPacientes();
    }
  }

  esAdministrador(): boolean {
    return this.authStore.usuario()?.rol === 'ADMINISTRADOR';
  }

  cargarMedicos(): void {
    this.cargandoMedicos.set(true);

    this.reservasApi.getMedicos().subscribe({
      next: (data) => {
        this.medicos.set(data);
        this.cargandoMedicos.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoMedicos.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los médicos',
          detail: mensajeDeError(err),
        });
      },
    });
  }

  cargarPacientes(): void {
    this.cargandoPacientes.set(true);

    this.pacientesApi.getPacientes().subscribe({
      next: (data) => {
        this.pacientes.set(data);
        this.cargandoPacientes.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoPacientes.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron cargar los pacientes',
          detail: mensajeDeError(err),
        });
      },
    });
  }

  cambioMedico(id: number | null): void {
    this.medicoSeleccionado.set(id);
    this.horaSeleccionada.set(null);
    this.cargarDisponibilidad();
  }

  cambioFecha(fecha: Date | null): void {
    this.fechaSeleccionada.set(fecha);
    this.horaSeleccionada.set(null);
    this.cargarDisponibilidad();
  }

  cargarDisponibilidad(): void {
    const idMedico = this.medicoSeleccionado();
    const fecha = this.fechaSeleccionada();
    const solicitud = ++this.solicitudDisponibilidad;

    this.horariosOcupados.set([]);
    this.errorDisponibilidad.set(false);

    if (idMedico === null || !fecha) {
      this.cargandoDisponibilidad.set(false);
      return;
    }

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaConsulta = `${anio}-${mes}-${dia}`;

    this.cargandoDisponibilidad.set(true);

    this.reservasApi
      .getHorariosOcupados(idMedico, fechaConsulta)
      .subscribe({
        next: (horarios) => {
          if (solicitud !== this.solicitudDisponibilidad) return;
          this.horariosOcupados.set(horarios);
          this.cargandoDisponibilidad.set(false);
        },
        error: (err: HttpErrorResponse) => {
          if (solicitud !== this.solicitudDisponibilidad) return;
          this.cargandoDisponibilidad.set(false);
          this.errorDisponibilidad.set(true);

          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo consultar la disponibilidad',
            detail: mensajeDeError(err),
          });
        },
      });
  }

  horarioOcupado(hora: string): boolean {
    return this.horariosOcupados().includes(hora);
  }

reservar(): void {
    const medicoId = this.medicoSeleccionado();
    const fecha = this.fechaSeleccionada();
    const hora = this.horaSeleccionada();
    const pacienteId = this.pacienteSeleccionado();

    if (this.esAdministrador() && !pacienteId) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta paciente',
        text: 'Debe seleccionar un paciente para asignarle el turno.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    if (medicoId === null || !fecha || !hora) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Seleccioná un médico, una fecha y un horario.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const [horas, minutos] = hora.split(':').map(Number);
    const fechaHora = new Date(fecha);
    fechaHora.setHours(horas, minutos, 0, 0);

    if (fechaHora <= new Date()) {
      Swal.fire({
        icon: 'warning',
        title: 'Horario no válido',
        text: 'Seleccioná una fecha y hora futuras.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    // Obtenemos los nombres del médico y del paciente seleccionado para mostrarlos en la alerta
    const medicoObj = this.medicos().find(m => m.id === medicoId);
    let nombrePacienteTexto = 'Usted mismo (Paciente actual)';
    let dniTexto = '';

    if (this.esAdministrador() && pacienteId) {
      const pacienteObj = this.pacientes().find(p => p.id === pacienteId);
      if (pacienteObj) {
        nombrePacienteTexto = `${pacienteObj.apellidos}, ${pacienteObj.nombres}`;
        dniTexto = pacienteObj.documento;
      }
    }

    const fechaFormateada = fecha.toLocaleDateString();

    // Mensaje de confirmación con SweetAlert2 mostrando todos los datos
    Swal.fire({
      title: '¿Confirmar la reserva?',
      html: `
        <div style="text-align: left; font-size: 15px; line-height: 1.6;">
          ${this.esAdministrador() ? `<b>Paciente:</b> ${nombrePacienteTexto}<br><b>DNI:</b>${dniTexto}<br>` : ''}
          <b>Médico:</b> Dr/a. ${medicoObj?.apellidos}, ${medicoObj?.nombres}<br>
          <b>Fecha:</b> ${fechaFormateada}<br>
          <b>Horario:</b> ${hora} hs
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        const datos: CrearReservaRequest = {
          idMedico: medicoId,
          fechaHora: fechaHora.toISOString(),
          ...(this.esAdministrador() && pacienteId ? { idPaciente: pacienteId } : {}),
        };

        this.guardando.set(true);

        this.reservasApi.crear(datos).subscribe({
          next: () => {
            this.guardando.set(false);
            Swal.fire({
              icon: 'success',
              title: '¡Turno Reservado!',
              text: 'La reserva se registró correctamente en el sistema.',
              confirmButtonColor: '#10b981',
              timer: 3000,
              timerProgressBar: true,
            }).then(() => {
              const rutaRedireccion = this.esAdministrador() ? '/admin/dashboard' : '/paciente/mis-turnos';
              this.router.navigate([rutaRedireccion]);
            });
          },
          error: (err: HttpErrorResponse) => {
            this.guardando.set(false);
            Swal.fire({
              icon: 'error',
              title: 'Error al reservar',
              text: mensajeDeError(err),
              confirmButtonColor: '#ef4444',
            });
          },
        });
      }
    });
  }

  volver(): void {
    const rutaRedireccion = this.esAdministrador() ? '/admin/dashboard' : '/paciente/mis-turnos';
    this.router.navigate([rutaRedireccion]);
  }

  private inicioDelDia(fecha: Date): Date {
    const resultado = new Date(fecha);
    resultado.setHours(0, 0, 0, 0);
    return resultado;
  }
}