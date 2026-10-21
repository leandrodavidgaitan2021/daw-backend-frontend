export interface CrearReservaDTO {
  idMedico: number;
  idPaciente?: number; // Opcional, generalmente especificado solo por el administrador
  fechaHora: string;   // Formato ISO string manejado en el cliente (ej. datetime-local)
}