const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyOriginMigration() {
  // Usar usuário postgres com permissões administrativas
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres', // Senha padrão do PostgreSQL local
    database: 'kmiza27_dev',
    ssl: false
  });

  try {
    console.log('🔌 Conectando ao banco de dados como postgres...');
    console.log(`📍 Host: ${client.host}:${client.port}`);
    console.log(`🗄️ Database: ${client.database}`);
    console.log(`👤 User: ${client.user}`);
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'fix-origin-migration.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executando migração manual para adicionar coluna origin...');
    const result = await client.query(sqlContent);
    
    console.log('✅ Migração executada com sucesso!');
    
    // Mostrar resultado da verificação
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Estrutura da coluna origin:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}(${row.character_maximum_length}) DEFAULT '${row.column_default}' (nullable: ${row.is_nullable})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    if (error.code) {
      console.error(`💥 Código do erro: ${error.code}`);
    }
    console.error('🔍 Detalhes do erro:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

// Executar a migração
applyOriginMigration(); 