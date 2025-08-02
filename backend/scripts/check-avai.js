const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkAvai() {
  try {
    await client.connect();
    console.log('🔍 Procurando times com nome parecido com Avaí...');
    
    const result = await client.query(
      "SELECT id, name, short_name, aliases FROM teams WHERE LOWER(name) LIKE '%ava%' OR LOWER(short_name) LIKE '%ava%'"
    );
    
    console.log('📋 Times encontrados:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum time encontrado com "ava" no nome');
      
      // Buscar Avaí especificamente
      const avaiResult = await client.query(
        "SELECT id, name, short_name, aliases FROM teams WHERE LOWER(name) = 'avaí' OR LOWER(name) = 'avai'"
      );
      console.log('📋 Busca específica por Avaí:', avaiResult.rows);
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkAvai();