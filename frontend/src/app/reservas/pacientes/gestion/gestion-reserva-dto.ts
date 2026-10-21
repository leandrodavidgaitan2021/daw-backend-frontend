export interface CrearReservaDTO {
  idMedico: number;
  fechaHora: string; // Formato ISO local YYYY-MM-DDTHH:mm:ss
}

export interface ModificarReservaDto {
  fechaHora?: string;
}