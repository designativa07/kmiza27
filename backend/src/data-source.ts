import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
// import * as pg from 'pg'; // Não é mais necessário

dotenv.config(); // Carrega as variáveis de ambiente do .env

const entitiesPath = path.join(__dirname, 'entities/**/*.entity{.ts,.js}');
const migrationsPath = path.join(__dirname, 'migrations/*{.ts,.js}');

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'kmiza27_dev',
  schema: 'public',
  entities: [entitiesPath],
  migrations: [migrationsPath],
  synchronize: process.env.NODE_ENV === 'development' ? true : false, // Sincronizar em desenvolvimento
  logging: process.env.NODE_ENV === 'development' ? true : false,
  ssl: false,
  extra: {
    connectionTimeoutMillis: 20000,
    options: '-c TimeZone=America/Sao_Paulo', // Configuração do fuso horário para a sessão do PostgreSQL
  },
};

export const AppDataSource = new DataSource(dataSourceOptions); 