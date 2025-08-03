const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function addMultipleBroadcasts() {
  try {
    await client.connect();
    console.log('🔍 Adicionando múltiplas transmissões...');
    
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
    
    // Buscar canais existentes (Premiere, Record, etc.)
    const channels = await client.query(`
      SELECT id, name, channel_link FROM channels 
      WHERE active = true 
      AND (name ILIKE '%premiere%' OR name ILIKE '%record%' OR name ILIKE '%globo%' OR name ILIKE '%cazé%')
      ORDER BY name
    `);
    
    console.log(`📺 Canais encontrados: ${channels.rows.length}`);
    channels.rows.forEach(channel => {
      console.log(`  - ${channel.name} (${channel.channel_link})`);
    });
    
    // Adicionar transmissões para cada canal (se não existir)
    for (const channel of channels.rows) {
      const existing = await client.query(`
        SELECT id FROM match_broadcasts 
        WHERE match_id = $1 AND channel_id = $2
      `, [matchId, channel.id]);
      
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO match_broadcasts (match_id, channel_id)
          VALUES ($1, $2)
        `, [matchId, channel.id]);
        
        console.log(`✅ Transmissão adicionada: ${channel.name}`);
      } else {
        console.log(`⚠️ Transmissão já existe: ${channel.name}`);
      }
    }
    
    // Verificar total final
    const finalCount = await client.query(`
      SELECT COUNT(*) as total FROM match_broadcasts WHERE match_id = $1
    `, [matchId]);
    
    console.log(`\n🎯 Total de transmissões para esta partida: ${finalCount.rows[0].total}`);
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

addMultipleBroadcasts();