// src/seed.ts
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { Usuario } from './modules/gestion/entities/usuario.entity';
import { Medico } from './modules/gestion/entities/medico.entity';
import { RolesUsuarios } from './modules/gestion/enums/roles-usuarios.enum';
import { EstadosUsuarios } from './modules/gestion/enums/estados-usuarios.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usuarioRepo = app.get<Repository<Usuario>>(getRepositoryToken(Usuario));
  const medicoRepo = app.get<Repository<Medico>>(getRepositoryToken(Medico));

  // Todos los usuarios de prueba comparten la clave 12345678
  const passwordHash = await bcrypt.hash('12345678', 10);

  // Crea el usuario si el email no existe; si existe, lo devuelve sin duplicarlo
  const crearUsuario = async (
    datos: Partial<Usuario> & { email: string },
  ): Promise<Usuario> => { 
    const existente = await usuarioRepo.findOne({
      where: { email: datos.email },
    });
    if (existente) return existente;

    const nuevo = await usuarioRepo.save(
      usuarioRepo.create({ ...datos, clave: passwordHash }),
    );
    console.log(
      `Usuario creado: ${nuevo.email} (${nuevo.rol}, ${nuevo.estado})`,
    );
    return nuevo;
  };

  // Crea el perfil de médico (matrícula y valor de consulta) si todavía no existe
  const crearMedico = async (
    usuario: Usuario,
    matricula: number,
    valorConsulta: number,
  ) => {
    const existente = await medicoRepo.findOne({
      where: { idUsuario: usuario.id },
    });
    if (existente) return;

    await medicoRepo.save(
      medicoRepo.create({ matricula, valorConsulta, usuario }),
    );
    console.log(`Perfil de médico creado: ${matricula}`);
  };

  // Administrador
  await crearUsuario({
    documento: '11111111',
    email: 'admin@clinica.com',
    nombres: 'Administrador',
    apellidos: 'General',
    rol: RolesUsuarios.ADMINISTRADOR,
    estado: EstadosUsuarios.ACTIVO,
  });

  // Médicos
  const medico1 = await crearUsuario({
    documento: '22222222',
    email: 'medico@clinica.com',
    nombres: 'Carlos',
    apellidos: 'Pérez',
    rol: RolesUsuarios.MEDICO,
    estado: EstadosUsuarios.ACTIVO,
  });
  await crearMedico(medico1, 98765, 15000);

  const medico2 = await crearUsuario({
    documento: '66666666',
    email: 'medica2@clinica.com',
    nombres: 'Laura',
    apellidos: 'Fernández',
    rol: RolesUsuarios.MEDICO,
    estado: EstadosUsuarios.ACTIVO,
  });
  await crearMedico(medico2, 54321, 18000);

  // Pacientes
  await crearUsuario({
    documento: '33333333',
    email: 'paciente@clinica.com',
    nombres: 'Juan',
    apellidos: 'Gómez',
    rol: RolesUsuarios.PACIENTE,
    estado: EstadosUsuarios.ACTIVO,
  });

  await crearUsuario({
    documento: '44444444',
    email: 'paciente2@clinica.com',
    nombres: 'María',
    apellidos: 'López',
    rol: RolesUsuarios.PACIENTE,
    estado: EstadosUsuarios.ACTIVO,
  });

  // Usuario dado de baja: sirve para mostrar que no puede iniciar sesión
  await crearUsuario({
    documento: '55555555',
    email: 'baja@clinica.com',
    nombres: 'Pedro',
    apellidos: 'Ramírez',
    rol: RolesUsuarios.PACIENTE,
    estado: EstadosUsuarios.BAJA,
  });

  await app.close();
  console.log('¡Seed completado con éxito!');
}
bootstrap();
