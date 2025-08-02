const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkCopaMatches() {
  try {
    console.log('🔍 Verificando partidas do Flamengo na Copa do Brasil...');
    
    await client.connect();
    
    // Buscar o Flamengo
    const teamQuery = `
      SELECT id, name 
      FROM teams 
      WHERE name ILIKE '%flamengo%'
    `;
    
    const teamResult = await client.query(teamQuery);
    
    if (teamResult.rows.length === 0) {
      console.log('❌ Flamengo não encontrado');
      return;
    }
    
    const flamengo = teamResult.rows[0];
    console.log(`✅ Flamengo encontrado: ${flamengo.name} (ID: ${flamengo.id})`);
    
    // Buscar partidas do Flamengo na Copa do Brasil
    const matchesQuery = `
      SELECT 
        m.id,
        m.match_date,
        m.status,
        ht.name as home_team,
        at.name as away_team,
        r.name as round_name,
        r.phase
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN competitions c ON m.competition_id = c.id
      LEFT JOIN rounds r ON m.round_id = r.id
      WHERE c.name = 'Copa do Brasil'
      AND (m.home_team_id = $1 OR m.away_team_id = $1)
      ORDER BY m.match_date
    `;
    
    const matchesResult = await client.query(matchesQuery, [flamengo.id]);
    
    console.log(`\n⚽ Partidas do Flamengo na Copa do Brasil: ${matchesResult.rows.length}`);
    
    matchesResult.rows.forEach((match, index) => {
      console.log(`\n${index + 1}. ${match.home_team} x ${match.away_team}`);
      console.log(`   Data: ${match.match_date}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Rodada: ${match.round_name || 'N/A'}`);
      console.log(`   Fase: ${match.phase || 'N/A'}`);
    });
    
    // Verificar rodadas da Copa do Brasil
    const roundsQuery = `
      SELECT 
        r.id,
        r.name,
        r.phase,
        r.round_number
      FROM rounds r
      JOIN competitions c ON r.competition_id = c.id
      WHERE c.name = 'Copa do Brasil'
      ORDER BY r.display_order, r.round_number
    `;
    
    const roundsResult = await client.query(roundsQuery);
    
    console.log(`\n🏆 Rodadas da Copa do Brasil: ${roundsResult.rows.length}`);
    
    roundsResult.rows.forEach((round, index) => {
      console.log(`\n${index + 1}. ${round.name || `Rodada ${round.round_number}`}`);
      console.log(`   Fase: ${round.phase || 'N/A'}`);
      console.log(`   Número: ${round.round_number}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

checkCopaMatches(); 