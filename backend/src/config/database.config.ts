import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || '195.200.0.191',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  database: process.env.DB_DATABASE || 'kmiza27',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // Não sincronizar automaticamente pois já temos o schema
  logging: process.env.NODE_ENV === 'development',
  ssl: false,
}); 