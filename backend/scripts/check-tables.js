const { Client } = require('pg');

async function checkTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'devuser',
    password: 'devuser',
    database: 'kmiza27_dev'
  });

  try {
    await client.connect();
    console.log('🔗 Conectado ao banco de dados');

    // Listar todas as tabelas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`📊 Tabelas encontradas (${tablesResult.rows.length}):\n`);
    
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    // Verificar se existe alguma tabela relacionada a times
    const teamTables = tablesResult.rows.filter(row => 
      row.table_name.toLowerCase().includes('team') || 
      row.table_name.toLowerCase().includes('time')
    );

    if (teamTables.length > 0) {
      console.log('\n🔍 Tabelas relacionadas a times:');
      teamTables.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Desconectado do banco de dados');
  }
}

checkTables(); 