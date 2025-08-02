const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function analyzeCompetitions() {
  try {
    await client.connect();
    console.log('🔍 Analisando competições do Flamengo...');
    
    // Buscar competições do Flamengo
    const result = await client.query(`
      SELECT 
        c.id, 
        c.name, 
        c.type,
        c.season,
        c.is_active
      FROM competitions c
      INNER JOIN competition_teams ct ON ct.competition_id = c.id
      INNER JOIN teams t ON t.id = ct.team_id
      WHERE t.name = 'Flamengo'
      AND c.is_active = true
      ORDER BY c.name
    `);
    
    console.log('📋 Competições do Flamengo:');
    result.rows.forEach(comp => {
      console.log(`  - ${comp.name} (${comp.type}) - Season: ${comp.season}`);
    });
    
    // Analisar partidas por competição
    for (const comp of result.rows) {
      console.log(`\n🏆 === ${comp.name} (${comp.type}) ===`);
      
      const matches = await client.query(`
        SELECT 
          m.id,
          m.match_date,
          m.status,
          ht.name as home_team,
          at.name as away_team,
          m.home_score,
          m.away_score,
          r.name as round_name,
          r.phase
        FROM matches m
        LEFT JOIN teams ht ON ht.id = m.home_team_id
        LEFT JOIN teams at ON at.id = m.away_team_id
        LEFT JOIN rounds r ON r.id = m.round_id
        WHERE m.competition_id = $1
        AND (m.home_team_id = (SELECT id FROM teams WHERE name = 'Flamengo')
         OR m.away_team_id = (SELECT id FROM teams WHERE name = 'Flamengo'))
        ORDER BY m.match_date DESC
        LIMIT 5
      `, [comp.id]);
      
      if (matches.rows.length > 0) {
        console.log('  Últimas partidas:');
        matches.rows.forEach(match => {
          const score = match.status === 'finished' ? 
            ` (${match.home_score || 0} x ${match.away_score || 0})` : '';
          console.log(`    ${match.match_date.toISOString().split('T')[0]} - ${match.home_team} x ${match.away_team}${score} - ${match.status} - Rodada: ${match.round_name || 'N/A'} - Fase: ${match.phase || 'N/A'}`);
        });
      } else {
        console.log('  Nenhuma partida encontrada');
      }
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

analyzeCompetitions();