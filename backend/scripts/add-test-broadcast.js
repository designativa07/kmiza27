const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function addTestBroadcast() {
  try {
    await client.connect();
    console.log('🔍 Adicionando transmissão de teste...');
    
    // Buscar a partida Ceará x Flamengo
    const match = await client.query(`
      SELECT m.id 
      FROM matches m
      LEFT JOIN teams ht ON ht.id = m.home_team_id
      LEFT JOIN teams at ON at.id = m.away_team_id
      WHERE ht.name = 'Ceará' AND at.name = 'Flamengo'
      AND m.match_date > NOW()
      AND m.status = 'scheduled'
      ORDER BY m.match_date ASC
      LIMIT 1
    `);
    
    if (match.rows.length === 0) {
      console.log('❌ Partida Ceará x Flamengo não encontrada');
      return;
    }
    
    const matchId = match.rows[0].id;
    console.log(`📋 Match ID encontrado: ${matchId}`);
    
    // Buscar um canal existente
    const channel = await client.query(`
      SELECT id, name FROM channels WHERE active = true LIMIT 1
    `);
    
    if (channel.rows.length === 0) {
      console.log('❌ Nenhum canal ativo encontrado');
      return;
    }
    
    const channelId = channel.rows[0].id;
    const channelName = channel.rows[0].name;
    console.log(`📺 Canal encontrado: ${channelName} (ID: ${channelId})`);
    
    // Verificar se já existe transmissão para esta partida
    const existing = await client.query(`
      SELECT id FROM match_broadcasts 
      WHERE match_id = $1 AND channel_id = $2
    `, [matchId, channelId]);
    
    if (existing.rows.length > 0) {
      console.log('✅ Transmissão já existe para esta partida');
    } else {
      // Adicionar transmissão de teste
      await client.query(`
        INSERT INTO match_broadcasts (match_id, channel_id)
        VALUES ($1, $2)
      `, [matchId, channelId]);
      
      console.log('✅ Transmissão de teste adicionada!');
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

addTestBroadcast();