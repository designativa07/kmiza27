import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://postgres:8F1DC9A7F9CE32C4D32E88A1C5FF7@h4xd66.easypanel.host:5433/kmiza27?sslmode=disable',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // Não sincronizar automaticamente pois já temos o schema
  logging: process.env.NODE_ENV === 'development',
  ssl: false,
}); 