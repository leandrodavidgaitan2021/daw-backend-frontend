import { CrearReservaDTO } from './crear-reserva-dto';
import { EstadosReservas } from '../estados-reservas-enum';

export interface ModificarReservaDto extends Partial<CrearReservaDTO> {
  estado?: EstadosReservas;
}