const { Client } = require('pg');

async function testPlayersDB() {
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

    // Verificar se a tabela players existe e tem dados
    console.log('🔍 Verificando tabela players...');
    const playersResult = await client.query('SELECT COUNT(*) as total FROM players');
    console.log(`📊 Total de jogadores na tabela: ${playersResult.rows[0].total}`);

    // Buscar alguns jogadores
    const playersData = await client.query('SELECT id, name, position, nationality FROM players LIMIT 5');
    console.log('📋 Primeiros 5 jogadores:');
    playersData.rows.forEach(player => {
      console.log(`  - ID: ${player.id}, Nome: ${player.name}, Posição: ${player.position}, Nacionalidade: ${player.nationality}`);
    });

    // Verificar se a tabela player_team_history existe
    console.log('🔍 Verificando tabela player_team_history...');
    const historyResult = await client.query('SELECT COUNT(*) as total FROM player_team_history');
    console.log(`📊 Total de registros no histórico: ${historyResult.rows[0].total}`);

  } catch (error) {
    console.error('❌ Erro ao testar banco:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

testPlayersDB(); 