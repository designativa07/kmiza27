import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LogLevel } from 'typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const loggingLevels: LogLevel[] = isDevelopment ? ['error'] : ['error'];

  const baseConfig = {
    type: 'postgres' as const,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false, // Desabilitado - usar migrações SQL manuais
    logging: loggingLevels,
    schema: 'public',
    extra: {
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
  };

  if (process.env.DATABASE_URL && !isDevelopment) {
    return {
      ...baseConfig,
      url: process.env.DATABASE_URL,
    };
  }

  return {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'kmiza27_dev',
  };
}; 