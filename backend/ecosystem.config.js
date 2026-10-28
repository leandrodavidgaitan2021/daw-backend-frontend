/**
 * Configuración de despliegue para PM2
 * 
 * 1. Define 'clinica-backend' como proceso gestionado por PM2 ejecutando el código compilado (dist/main.js).
 * 2. Define las variables de entorno necesarias extraídas de tu archivo .env.
 */

module.exports = {
  apps: [
    {
      name: 'clinica-backend',
      script: 'dist/main.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_TYPE: 'postgres',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_USER: 'postgres',
        DB_PASSWORD: 'ew43psta',
        DB_NAME: 'clinica_db',
        DB_SYNCHRONIZE: 'true',
        DB_LOGGING: 'true',
        DB_SYNC: 'true',
        SWAGGER_HABILITADO: 'true',
        JWT_SECRET: 'gtT0zY6&5Sx%7c29x&04@^@73D&uz^xQ',
        
        
      }
    }
  ]
};
  
