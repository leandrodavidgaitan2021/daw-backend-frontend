import { Component, computed, effect, inject, model, ModelSignal, output, Signal, signal } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService, ConfirmationService } from "primeng/api";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from 'primeng/inputnumber';

import { MedicoResponseDto } from "../listado/listado-medicos-dto";
import { ModificarValorConsultaDto } from "./modificar-valor-consulta-dto";
import { GestionMedicoApiClient } from "./gestion-medico-api-client";

@Component({
    selector: "app-gestion-medico",
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputNumberModule],
    templateUrl: "./gestion-medico.html",
    styleUrls: ["./gestion-medico.css"]
})
export class GestionMedico {
    visible: ModelSignal<boolean> = model(false);
    medicoSeleccionado: ModelSignal<MedicoResponseDto | null> = model<MedicoResponseDto | null>(null);
    
    readonly medicoGuardado = output<void>();

    header: Signal<string> = computed(() => {
        const medico = this.medicoSeleccionado();
        return medico ? `Modificar Valor de Consulta - Dr/a. ${medico.apellidos}, ${medico.nombres}` : "Nuevo Médico";
    });

    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService); // <-- Inyección del servicio de confirmación
    private readonly gestionMedicoApiClient = inject(GestionMedicoApiClient);

    // Campos del formulario con señales
    readonly valorConsulta = model<number | null>(null);
    readonly guardando = signal(false);

    constructor() {
        effect(() => {
            const medico = this.medicoSeleccionado();
            if (medico) {
                this.valorConsulta.set(medico.valorConsulta);
            } else {
                this.valorConsulta.set(null);
            }
        });
    }

    guardar(): void {
        const valor = this.valorConsulta();
        const medico = this.medicoSeleccionado();

        if (valor === null || valor <= 0) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Valor no válido', 
                detail: 'Por favor ingrese un valor de consulta mayor a 0.' 
            });
            return;
        }

        if (!medico) {
            this.guardando.set(false);
            return;
        }

        // 1. Ocultamos temporalmente el modal principal para mostrar el diálogo de confirmación limpio
        this.visible.set(false);

        // 2. Disparamos el cuadro de confirmación nativo de PrimeNG
        this.confirmationService.confirm({
            header: 'Confirmar modificación',
            message: `¿Estás seguro de que deseas actualizar el valor de la consulta para el/la Dr/a. ${medico.apellidos} a $${valor}?`,
            icon: 'pi pi-question-circle',
            acceptLabel: 'Sí, actualizar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-success',
            rejectButtonStyleClass: 'p-button-secondary p-button-text',
            accept: () => {
                const dto: ModificarValorConsultaDto = { valorConsulta: valor };
                this.guardando.set(true);

                this.gestionMedicoApiClient.actualizarValorConsulta(medico.id, dto).subscribe({
                    next: () => {
                        this.guardando.set(false);
                        this.messageService.add({ 
                            severity: 'success', 
                            summary: 'Éxito', 
                            detail: 'Valor de consulta actualizado correctamente.' 
                        });
                        this.medicoGuardado.emit();
                        this.cerrar();
                    },
                    error: (err: HttpErrorResponse) => {
                        this.guardando.set(false);
                        this.visible.set(true); // Reabrimos el modal si ocurre un error
                        
                        this.messageService.add({ 
                            severity: 'error', 
                            summary: 'Error', 
                            detail: err?.error?.message || 'No se pudo actualizar el valor.' 
                        });
                    }
                });
            },
            reject: () => {
                // Si el usuario cancela la confirmación, reabrimos el modal de gestión
                this.visible.set(true);
            }
        });
    }

    cerrar(): void {
        this.visible.set(false);
    }
}