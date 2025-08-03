const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function addBroadcastsOtherMatches() {
  try {
    await client.connect();
    console.log('🔍 Adicionando transmissões para outras partidas do Flamengo...');
    
    // Buscar próximas partidas do Flamengo
    const matches = await client.query(`
      SELECT m.id, ht.name as home_team, at.name as away_team, m.match_date,
             c.name as competition_name
      FROM matches m
      LEFT JOIN teams ht ON ht.id = m.home_team_id
      LEFT JOIN teams at ON at.id = m.away_team_id
      LEFT JOIN competitions c ON c.id = m.competition_id
      WHERE (ht.name = 'Flamengo' OR at.name = 'Flamengo')
      AND m.match_date > NOW()
      AND m.status = 'scheduled'
      ORDER BY m.match_date ASC
      LIMIT 5
    `);
    
    console.log(`🔥 Encontradas ${matches.rows.length} partidas do Flamengo:`);
    
    // Buscar alguns canais para adicionar
    const channels = await client.query(`
      SELECT id, name FROM channels 
      WHERE active = true 
      AND (name ILIKE '%premiere%' OR name ILIKE '%globo%' OR name ILIKE '%cazé%' OR name ILIKE '%record%')
      LIMIT 4
    `);
    
    for (const match of matches.rows) {
      console.log(`\n🎯 ${match.home_team} x ${match.away_team} (${match.competition_name})`);
      
      // Verificar quantas transmissões já existem
      const existing = await client.query(`
        SELECT COUNT(*) as count FROM match_broadcasts WHERE match_id = $1
      `, [match.id]);
      
      const currentCount = parseInt(existing.rows[0].count);
      console.log(`  📺 Transmissões atuais: ${currentCount}`);
      
      // Se já tem pelo menos 2 transmissões, pular
      if (currentCount >= 2) {
        console.log(`  ✅ Já tem transmissões suficientes`);
        continue;
      }
      
      // Adicionar 2-3 canais para esta partida
      const channelsToAdd = channels.rows.slice(0, 3);
      
      for (const channel of channelsToAdd) {
        const existingBroadcast = await client.query(`
          SELECT id FROM match_broadcasts 
          WHERE match_id = $1 AND channel_id = $2
        `, [match.id, channel.id]);
        
        if (existingBroadcast.rows.length === 0) {
          await client.query(`
            INSERT INTO match_broadcasts (match_id, channel_id)
            VALUES ($1, $2)
          `, [match.id, channel.id]);
          
          console.log(`    ✅ Adicionado: ${channel.name}`);
        }
      }
    }
    
    console.log('\n🎉 Transmissões adicionadas com sucesso!');
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

addBroadcastsOtherMatches();