import { DataSource, DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import * as dotenv from 'dotenv';
import * as path from 'path';
// import * as pg from 'pg'; // Não é mais necessário

dotenv.config(); // Carrega as variáveis de ambiente do .env

const entitiesPath = path.join(__dirname, 'entities/**/*.entity{.ts,.js}');
const migrationsPath = path.join(__dirname, 'migrations/*{.ts,.js}');

const dataSourceOptions: PostgresConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'h4xd66.easypanel.host',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  database: process.env.DB_DATABASE || 'kmiza27',
  entities: [entitiesPath],
  migrations: [migrationsPath],
  synchronize: false, // Não sincronizar automaticamente pois já temos o schema
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : false,
  ssl: false,
  extra: {
    connectionTimeoutMillis: 20000,
    options: '-c TimeZone=America/Sao_Paulo', // Configuração do fuso horário para a sessão do PostgreSQL
  },
};

export const AppDataSource = new DataSource(dataSourceOptions); 