const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function testUnaccent() {
  try {
    await client.connect();
    console.log('🔍 Testando se UNACCENT está disponível...');
    
    // Testar UNACCENT
    try {
      const result = await client.query("SELECT UNACCENT('avaí') as test");
      console.log('✅ UNACCENT está disponível:', result.rows[0].test);
    } catch (error) {
      console.log('❌ UNACCENT não está disponível:', error.message);
      
      // Testar busca normal
      const result = await client.query(
        "SELECT id, name FROM teams WHERE LOWER(name) LIKE LOWER('%avaí%')"
      );
      console.log('📋 Busca normal:', result.rows);
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testUnaccent();