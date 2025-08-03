const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function fixBroadcastChannels() {
  try {
    await client.connect();
    console.log('🔍 Corrigindo broadcast_channels...');
    
    // Buscar a partida Ceará x Flamengo
    const match = await client.query(`
      SELECT m.id 
      FROM matches m
      LEFT JOIN teams ht ON ht.id = m.home_team_id
      LEFT JOIN teams at ON at.id = m.away_team_id
      WHERE ht.name = 'Ceará' AND at.name = 'Flamengo'
      AND m.match_date > NOW()
      ORDER BY m.match_date ASC
      LIMIT 1
    `);
    
    if (match.rows.length === 0) {
      console.log('❌ Partida Ceará x Flamengo não encontrada');
      return;
    }
    
    const matchId = match.rows[0].id;
    console.log(`📋 Match ID encontrado: ${matchId}`);
    
    // Manter apenas o link real do YouTube (remover o link do Premiere que parece ser de canal)
    const broadcastData = [
      "https://www.youtube.com/watch?v=W8z_ef8YICc" // Apenas link direto real
    ];
    
    await client.query(`
      UPDATE matches 
      SET broadcast_channels = $1
      WHERE id = $2
    `, [JSON.stringify(broadcastData), matchId]);
    
    console.log('✅ broadcast_channels corrigido!');
    
    // Verificar o resultado
    const updated = await client.query(`
      SELECT broadcast_channels FROM matches WHERE id = $1
    `, [matchId]);
    
    console.log('📺 broadcast_channels atualizado:');
    console.log(updated.rows[0].broadcast_channels);
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixBroadcastChannels();