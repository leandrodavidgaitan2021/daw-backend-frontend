import { Component, inject, OnInit, signal, WritableSignal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MessageService, ConfirmationService } from "primeng/api";
import { TableModule } from 'primeng/table';
import { ButtonModule } from "primeng/button";
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { MedicoResponseDto } from "./listado-medicos-dto";
import { MedicosListadoApiClient } from "./medicos-listado-api-cliente";
import { Template } from "../../template/template";
import { GestionMedico } from "../gestion/gestion-medico";

@Component({
    selector: "app-medicos-listado",
    standalone: true,
    templateUrl: "./medicos-listado.html",
    styleUrls: ["./medicos-listado.css"],
    imports: [CommonModule, TableModule, ButtonModule, TooltipModule, ConfirmDialogModule, GestionMedico],
    providers: [ConfirmationService]
})
export class MedicosListado implements OnInit {
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly medicosListadoApiClient = inject(MedicosListadoApiClient);

    readonly medicos: WritableSignal<MedicoResponseDto[]> = signal([]);
    readonly cargando = signal(false);
    
    // Control del modal de gestión
    readonly dialogVisible = signal(false);
    readonly medicoSeleccionado = signal<MedicoResponseDto | null>(null);

    ngOnInit(): void {
        this.refrescarMedicos();
    }

    refrescarMedicos(): void {
        this.cargando.set(true);
        this.medicosListadoApiClient.getMedicos().subscribe({
            next: (data) => {
                this.medicos.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el listado de médicos.' });
            }
        });
    }


    editarValorConsulta(medico: MedicoResponseDto): void {
        this.medicoSeleccionado.set(medico);
        this.dialogVisible.set(true);
    }


}