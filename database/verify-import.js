const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function verifyImport() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando dados importados...');
    
    // Verificar jogos importados
    console.log('\n⚽ Jogos agendados:');
    const matches = await client.query(`
      SELECT 
        m.id,
        c.name as competition,
        ht.name as home_team,
        at.name as away_team,
        m.match_date,
        m.status,
        s.name as stadium,
        m.broadcast_channels
      FROM matches m
      JOIN competitions c ON m.competition_id = c.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN stadiums s ON m.stadium_id = s.id
      WHERE m.status = 'scheduled'
      ORDER BY m.match_date
      LIMIT 10
    `);
    
    matches.rows.forEach(match => {
      console.log(`  📅 ${match.match_date.toISOString().slice(0, 16).replace('T', ' ')}`);
      console.log(`     ${match.home_team} vs ${match.away_team}`);
      console.log(`     🏟️ ${match.stadium || 'Estádio não definido'}`);
      console.log(`     📺 Canais: ${JSON.stringify(match.broadcast_channels)}`);
      console.log('');
    });
    
    // Estatísticas gerais
    console.log('\n📊 Estatísticas:');
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM teams) as total_teams,
        (SELECT COUNT(*) FROM competitions) as total_competitions,
        (SELECT COUNT(*) FROM matches) as total_matches,
        (SELECT COUNT(*) FROM matches WHERE status = 'scheduled') as scheduled_matches,
        (SELECT COUNT(*) FROM stadiums) as total_stadiums
    `);
    
    const stat = stats.rows[0];
    console.log(`  🏆 Times: ${stat.total_teams}`);
    console.log(`  🏅 Competições: ${stat.total_competitions}`);
    console.log(`  ⚽ Total de jogos: ${stat.total_matches}`);
    console.log(`  📅 Jogos agendados: ${stat.scheduled_matches}`);
    console.log(`  🏟️ Estádios: ${stat.total_stadiums}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyImport().catch(console.error); 