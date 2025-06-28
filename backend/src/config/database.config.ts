import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://devuser:devuser@localhost:5432/kmiza27_dev',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development', // Sincronizar em desenvolvimento
  logging: process.env.NODE_ENV === 'development',
  ssl: false,
}); 