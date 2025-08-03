const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkBroadcastChannels() {
  try {
    await client.connect();
    console.log('🔍 Verificando campo broadcast_channels...');
    
    // Verificar partidas com broadcast_channels preenchido
    const matches = await client.query(`
      SELECT m.id, ht.name as home_team, at.name as away_team, 
             m.broadcast_channels, m.match_date
      FROM matches m
      LEFT JOIN teams ht ON ht.id = m.home_team_id
      LEFT JOIN teams at ON at.id = m.away_team_id
      WHERE m.broadcast_channels IS NOT NULL
      AND m.match_date > NOW()
      ORDER BY m.match_date ASC
      LIMIT 10
    `);
    
    console.log(`📺 Partidas com broadcast_channels: ${matches.rows.length}`);
    
    matches.rows.forEach(match => {
      console.log(`\n🎯 ${match.home_team} x ${match.away_team} (ID: ${match.id})`);
      console.log(`   📅 ${match.match_date.toISOString().split('T')[0]}`);
      console.log(`   📺 broadcast_channels:`, match.broadcast_channels);
    });
    
    // Verificar especificamente a partida Ceará x Flamengo
    const ceraraFlamengo = await client.query(`
      SELECT m.id, m.broadcast_channels
      FROM matches m
      LEFT JOIN teams ht ON ht.id = m.home_team_id
      LEFT JOIN teams at ON at.id = m.away_team_id
      WHERE ht.name = 'Ceará' AND at.name = 'Flamengo'
      AND m.match_date > NOW()
      ORDER BY m.match_date ASC
      LIMIT 1
    `);
    
    if (ceraraFlamengo.rows.length > 0) {
      console.log(`\n🔥 Ceará x Flamengo (ID: ${ceraraFlamengo.rows[0].id}):`);
      console.log(`   📺 broadcast_channels:`, ceraraFlamengo.rows[0].broadcast_channels);
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkBroadcastChannels();