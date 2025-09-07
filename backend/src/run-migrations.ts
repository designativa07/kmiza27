import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SystemSetting } from './entities/system-setting.entity';

async function runMigrations() {
  console.log('🚀 Iniciando execução de migrações...');

  try {
    // Configuração do banco baseada no environment
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'kmiza27_dev',
      entities: [__dirname + '/entities/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: true,
    });

    console.log('📡 Conectando ao banco de dados...');
    await dataSource.initialize();

    console.log('⚡ Executando migrações pendentes...');
    const migrations = await dataSource.runMigrations();
    
    if (migrations.length > 0) {
      console.log(`✅ ${migrations.length} migrações executadas com sucesso:`);
      migrations.forEach(migration => {
        console.log(`  - ${migration.name}`);
      });
    } else {
      console.log('✅ Nenhuma migração pendente encontrada');
    }

    // Verificar se as configurações de imagem foram criadas
    console.log('🔍 Verificando configurações de imagem da Futepédia...');
    const settingsRepo = dataSource.getRepository(SystemSetting);
    
    const ogImageSetting = await settingsRepo.findOne({
      where: { key: 'futepedia_og_image_url' }
    });
    
    const headerLogoSetting = await settingsRepo.findOne({
      where: { key: 'futepedia_header_logo_url' }
    });

    console.log('📊 Status das configurações:');
    console.log(`  - futepedia_og_image_url: ${ogImageSetting ? 'EXISTS' : 'MISSING'}`);
    console.log(`  - futepedia_header_logo_url: ${headerLogoSetting ? 'EXISTS' : 'MISSING'}`);

    await dataSource.destroy();
    console.log('🎉 Migrações concluídas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigrations();
}

export { runMigrations }; 