const { Client } = require('pg');
require('dotenv').config();

async function addWelcomeSentColumnProduction() {
  // Credenciais para produção (195.200.0.191:5433, database: kmiza27)
  const client = new Client({
    host: '195.200.0.191',
    port: 5433,
    user: process.env.DB_USERNAME_PROD || 'admin', // Assumindo que usa admin em produção
    password: process.env.DB_PASSWORD_PROD || 'password',
    database: 'kmiza27',
  });

  try {
    await client.connect();
    console.log('🔌 Conectado ao banco de dados de PRODUÇÃO');

    // Verificar se a coluna já existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'welcome_sent'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ Coluna welcome_sent já existe em PRODUÇÃO');
      return;
    }

    // Adicionar a coluna
    await client.query(`
      ALTER TABLE "users" 
      ADD COLUMN "welcome_sent" boolean DEFAULT false
    `);

    console.log('✅ Coluna welcome_sent adicionada com sucesso em PRODUÇÃO!');

  } catch (error) {
    console.error('❌ Erro ao adicionar coluna em PRODUÇÃO:', error.message);
  } finally {
    await client.end();
  }
}

addWelcomeSentColumnProduction(); 