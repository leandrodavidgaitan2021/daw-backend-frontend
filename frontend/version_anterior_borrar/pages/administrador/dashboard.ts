import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-administrador-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './dashboard.html',
})
export class AdministradorDashboardComponent {
  private router = inject(Router);

  irAReservarTurno(): void {
    this.router.navigate(['/admin/reservar-turno']); // O la ruta que maneje la reserva de turnos por parte del admin
  }

  irAGestionTurnos(): void {
    this.router.navigate(['/admin/turnos']);
  }

  irAGestionPacientes(): void {
    this.router.navigate(['/admin/pacientes']);
  }

  irAGestionMedicos(): void {
    this.router.navigate(['/admin/medicos']);
  }
}