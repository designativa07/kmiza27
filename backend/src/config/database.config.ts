import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://devuser:devpass123@localhost:5432/kmiza27_dev', // ATUALIZE AQUI COM SUAS CREDENCIAIS
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // Não sincronizar automaticamente pois já temos o schema
  logging: process.env.NODE_ENV === 'development',
  ssl: false,
}); 