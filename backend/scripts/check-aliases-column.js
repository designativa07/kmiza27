const { Client } = require('pg');

async function checkAliasesColumn() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'devuser',
    password: 'devuser',
    database: 'kmiza27_dev'
  });

  try {
    await client.connect();
    console.log('🔍 Verificando se a coluna aliases existe...');
    
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      AND column_name = 'aliases'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Coluna aliases existe na tabela teams');
      
      // Verificar se há dados na coluna
      const dataResult = await client.query(`
        SELECT name, aliases 
        FROM teams 
        WHERE aliases IS NOT NULL 
        LIMIT 5
      `);
      
      console.log('📊 Dados de exemplo na coluna aliases:');
      dataResult.rows.forEach(row => {
        console.log(`  ${row.name}: ${JSON.stringify(row.aliases)}`);
      });
      
    } else {
      console.log('❌ Coluna aliases NÃO existe na tabela teams');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkAliasesColumn(); 