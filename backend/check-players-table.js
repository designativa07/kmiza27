const { Client } = require('pg');

async function checkPlayersTable() {
  const client = new Client({
    host: '195.200.0.191',
    port: 5433,
    user: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
    ssl: false
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Verificar estrutura da tabela players
    console.log('🔍 Verificando estrutura da tabela players...');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estrutura da tabela players:');
    tableStructure.rows.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    // Verificar alguns dados
    console.log('\n🔍 Verificando dados da tabela...');
    const sampleData = await client.query('SELECT * FROM players LIMIT 2');
    console.log('📊 Dados de exemplo:');
    sampleData.rows.forEach((row, index) => {
      console.log(`  Jogador ${index + 1}:`, row);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

checkPlayersTable(); 