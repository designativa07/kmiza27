const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27',
  user: 'postgres',
  password: 'postgres123'
});

async function addMenuConfig() {
  try {
    await pool.query(`
      INSERT INTO bot_configs (key, value, description, type) VALUES 
      ('menu_description', 'Selecione uma das opções abaixo para começar:', 'Descrição exibida no menu interativo do WhatsApp', 'text')
      ON CONFLICT (key) DO NOTHING;
    `);
    
    console.log('✅ Configuração menu_description adicionada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addMenuConfig(); 