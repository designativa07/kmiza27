import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const dataSource = app.get(DataSource);

  console.log('🏁 Iniciando a execução das migrações...');

  try {
    await dataSource.runMigrations();
    console.log('✅ Migrações executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
  } finally {
    await app.close();
    console.log('🔚 Conexão com o banco de dados fechada.');
  }
}

bootstrap(); 