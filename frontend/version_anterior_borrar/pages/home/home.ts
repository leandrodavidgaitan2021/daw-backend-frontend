import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { AuthStore } from '../../../auth/auth-store';
import { mensajeDeError } from '../../shared/mensaje-error';
import { MedicoApiClient, MedicoResponse } from '../../shared/medico-api-client';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private medicoApiClient = inject(MedicoApiClient);
  private router = inject(Router);
  private messageService = inject(MessageService);

  readonly medicos = signal<MedicoResponse[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    // Un médico con sesión iniciada va directo a su agenda
    if (this.authStore.isAuthenticated() && this.authStore.usuario()?.rol === 'MEDICO') {
      this.router.navigate(['/medico/turnos']);
      return;
    }

    this.medicoApiClient.getMedicos().subscribe({
      next: (data) => {
        this.medicos.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo cargar la lista de médicos',
          detail: mensajeDeError(err),
        });
      }
    });
  }
}