// src/modules/auth/dtos/login.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty({
    example: 'admin@clinica.com',
    description: 'Correo electrónico registrado',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '12345678',
    description: 'Contraseña de acceso',
  })
  @IsString()
  @IsNotEmpty()
  clave: string;
}
