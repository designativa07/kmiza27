const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function verifyAllRounds() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando todas as rodadas importadas...\n');
    
    // Verificar rodadas com jogos
    const roundsQuery = await client.query(`
      SELECT 
        r.name as round_name,
        COUNT(m.id) as matches_count,
        MIN(m.match_date) as first_match,
        MAX(m.match_date) as last_match
      FROM rounds r 
      LEFT JOIN matches m ON r.id = m.round_id 
      WHERE r.competition_id = (SELECT id FROM competitions WHERE name = 'Brasileirão Série A')
      GROUP BY r.id, r.name 
      ORDER BY 
        CASE 
          WHEN r.name ~ '^Rodada [0-9]+$' THEN CAST(SUBSTRING(r.name FROM '[0-9]+') AS INTEGER)
          ELSE 999
        END
    `);
    
    console.log('📋 Rodadas do Brasileirão Série A:');
    console.log('=====================================');
    
    let totalMatches = 0;
    roundsQuery.rows.forEach(round => {
      const matchCount = parseInt(round.matches_count);
      totalMatches += matchCount;
      
      if (matchCount > 0) {
        const firstDate = new Date(round.first_match).toLocaleDateString('pt-BR');
        const lastDate = new Date(round.last_match).toLocaleDateString('pt-BR');
        console.log(`✅ ${round.round_name}: ${matchCount} jogos (${firstDate} - ${lastDate})`);
      } else {
        console.log(`⚪ ${round.round_name}: ${matchCount} jogos`);
      }
    });
    
    console.log('=====================================');
    console.log(`📊 Total de jogos: ${totalMatches}`);
    
    // Verificar distribuição por status
    const statusQuery = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM matches 
      WHERE competition_id = (SELECT id FROM competitions WHERE name = 'Brasileirão Série A')
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('\n📈 Status dos jogos:');
    statusQuery.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} jogos`);
    });
    
    // Verificar próximos jogos
    const nextMatches = await client.query(`
      SELECT 
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
        r.name as round_name,
        s.name as stadium
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN rounds r ON m.round_id = r.id
      LEFT JOIN stadiums s ON m.stadium_id = s.id
      WHERE m.status = 'scheduled' 
        AND m.competition_id = (SELECT id FROM competitions WHERE name = 'Brasileirão Série A')
      ORDER BY m.match_date
      LIMIT 5
    `);
    
    console.log('\n⏰ Próximos 5 jogos:');
    nextMatches.rows.forEach(match => {
      const date = new Date(match.match_date).toLocaleString('pt-BR');
      console.log(`  ${match.home_team} vs ${match.away_team}`);
      console.log(`    📅 ${date} | 🏟️ ${match.stadium || 'N/A'} | 🏆 ${match.round_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyAllRounds(); 