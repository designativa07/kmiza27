const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: '195.200.0.191',
    port: 5433,
    user: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
    ssl: false
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'database', 'add-send-interval-field.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executando migration...');
    const result = await client.query(sqlContent);
    
    console.log('✅ Migration executada com sucesso!');
    console.log('📋 Resultado:', result);

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

runMigration(); 