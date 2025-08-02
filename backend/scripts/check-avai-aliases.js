const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkAvaiAliases() {
  try {
    await client.connect();
    console.log('🔍 Verificando aliases do Avaí...');
    
    const result = await client.query(
      "SELECT id, name, aliases FROM teams WHERE name = 'Avaí'"
    );
    
    console.log('📋 Avaí encontrado:', result.rows);
    
    if (result.rows.length > 0) {
      const avai = result.rows[0];
      console.log(`\n📝 Time: ${avai.name} (ID: ${avai.id})`);
      console.log(`📝 Aliases atuais:`, avai.aliases);
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkAvaiAliases();