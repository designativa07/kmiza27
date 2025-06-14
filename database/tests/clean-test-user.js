const { Client } = require('pg');

const client = new Client({
  host: '195.200.0.191',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7'
});

async function cleanTestUser() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao PostgreSQL');

    await client.query('DELETE FROM users WHERE phone_number = $1', ['5511000000000']);
    console.log('✅ Usuário de teste removido');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

cleanTestUser(); 