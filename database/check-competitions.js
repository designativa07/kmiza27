const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function checkCompetitions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando competições...');
    
    const result = await client.query('SELECT id, name FROM competitions ORDER BY name');
    
    console.log('📋 Competições encontradas:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Nome: ${row.name}`);
    });
    
    // Verificar especificamente o Brasileirão
    const brasileirao = await client.query(`
      SELECT id, name FROM competitions 
      WHERE name ILIKE '%brasileir%' OR name ILIKE '%série a%'
    `);
    
    console.log('\n⚽ Competições do Brasileirão:');
    brasileirao.rows.forEach(row => {
      console.log(`ID: ${row.id}, Nome: ${row.name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkCompetitions().catch(console.error); 