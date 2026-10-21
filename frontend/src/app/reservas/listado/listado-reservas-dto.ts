import { EstadosReservas } from "../estados-reservas-enum";

export interface UsuarioResponseDto {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  email: string;
}

export interface MedicoResponseDto {
  id: number;
  matricula: number;
  valorConsulta: number;
  nombres: string;
  apellidos: string;
}

export interface ReservaResponseDto {
  id: number;
  fechaHora: string; // En el cliente se maneja como string (ISO format)
  estado: EstadosReservas;
  valorConsulta: number;
  paciente: UsuarioResponseDto;
  medico: MedicoResponseDto;
}