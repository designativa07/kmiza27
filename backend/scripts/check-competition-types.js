const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkCompetitionTypes() {
  try {
    console.log('🔍 Verificando tipos das competições...');
    
    await client.connect();
    
    const query = `
      SELECT id, name, type, is_active 
      FROM competitions 
      ORDER BY name
    `;
    
    const result = await client.query(query);
    
    console.log('\n📊 Competições encontradas:');
    result.rows.forEach(comp => {
      console.log(`  - ${comp.name} (ID: ${comp.id}, Tipo: ${comp.type}, Ativa: ${comp.is_active})`);
    });
    
    // Verificar especificamente a Copa do Brasil
    const copaQuery = `
      SELECT id, name, type, is_active 
      FROM competitions 
      WHERE name ILIKE '%copa do brasil%'
    `;
    
    const copaResult = await client.query(copaQuery);
    
    console.log('\n🏆 Copa do Brasil:');
    if (copaResult.rows.length > 0) {
      copaResult.rows.forEach(comp => {
        console.log(`  - ${comp.name} (ID: ${comp.id}, Tipo: ${comp.type}, Ativa: ${comp.is_active})`);
      });
    } else {
      console.log('  - Não encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

checkCompetitionTypes(); 