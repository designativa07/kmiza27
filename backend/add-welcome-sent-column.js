const { Client } = require('pg');
require('dotenv').config();

async function addWelcomeSentColumn() {
  // Credenciais para desenvolvimento (localhost:5432, user: postgres/postgres)
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'kmiza27_dev',
  });

  try {
    await client.connect();
    console.log('🔌 Conectado ao banco de dados');

    // Verificar se a coluna já existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'welcome_sent'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ Coluna welcome_sent já existe');
      return;
    }

    // Adicionar a coluna
    await client.query(`
      ALTER TABLE "users" 
      ADD COLUMN "welcome_sent" boolean DEFAULT false
    `);

    console.log('✅ Coluna welcome_sent adicionada com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
  } finally {
    await client.end();
  }
}

addWelcomeSentColumn(); 