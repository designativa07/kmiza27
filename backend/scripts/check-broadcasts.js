const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkBroadcasts() {
  try {
    await client.connect();
    console.log('🔍 Verificando transmissões no banco...');
    
    // Verificar se existe a tabela match_broadcasts
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'match_broadcasts'
      );
    `);
    
    console.log('📋 Tabela match_broadcasts existe:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Verificar quantos registros existem
      const count = await client.query('SELECT COUNT(*) FROM match_broadcasts');
      console.log('📋 Total de transmissões:', count.rows[0].count);
      
      // Mostrar alguns exemplos
      const examples = await client.query(`
        SELECT mb.id, mb.match_id, c.name as channel_name, c.channel_link 
        FROM match_broadcasts mb
        LEFT JOIN channels c ON c.id = mb.channel_id
        LIMIT 5
      `);
      
      console.log('📋 Exemplos de transmissões:');
      examples.rows.forEach(row => {
        console.log(`  - Match ${row.match_id}: ${row.channel_name} (${row.channel_link})`);
      });
      
      // Verificar próximas partidas do Flamengo
      const flamengoMatches = await client.query(`
        SELECT m.id, m.match_date, 
               ht.name as home_team, at.name as away_team,
               COUNT(mb.id) as broadcast_count
        FROM matches m
        LEFT JOIN teams ht ON ht.id = m.home_team_id
        LEFT JOIN teams at ON at.id = m.away_team_id
        LEFT JOIN match_broadcasts mb ON mb.match_id = m.id
        WHERE (ht.name = 'Flamengo' OR at.name = 'Flamengo')
        AND m.match_date > NOW()
        AND m.status = 'scheduled'
        GROUP BY m.id, m.match_date, ht.name, at.name
        ORDER BY m.match_date ASC
        LIMIT 3
      `);
      
      console.log('\n🔥 Próximas partidas do Flamengo:');
      flamengoMatches.rows.forEach(match => {
        console.log(`  - ${match.home_team} x ${match.away_team} (${match.match_date.toISOString().split('T')[0]}) - ${match.broadcast_count} transmissões`);
      });
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkBroadcasts();