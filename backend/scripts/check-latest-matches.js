const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkLatestMatches() {
  try {
    console.log('Verificando últimos jogos amadores...');

    // Buscar os últimos 5 jogos amadores
    const result = await pool.query(`
      SELECT 
        id,
        home_team_id,
        away_team_id,
        competition_id,
        stadium_id,
        match_date,
        status,
        home_score,
        away_score,
        category,
        created_at
      FROM matches 
      WHERE category = 'amateur'
      ORDER BY id DESC
      LIMIT 5;
    `);

    console.log('\nÚltimos jogos amadores:');
    console.log('ID | Home Team | Away Team | Competition | Date | Status | Score');
    console.log('---|-----------|-----------|-------------|------|--------|-------');
    
    for (const match of result.rows) {
      // Buscar nomes dos times
      let homeTeamName = 'N/A';
      let awayTeamName = 'N/A';
      let competitionName = 'N/A';

      if (match.home_team_id) {
        const homeTeam = await pool.query(`SELECT name FROM teams WHERE id = ${match.home_team_id}`);
        if (homeTeam.rows.length > 0) {
          homeTeamName = homeTeam.rows[0].name;
        }
      }

      if (match.away_team_id) {
        const awayTeam = await pool.query(`SELECT name FROM teams WHERE id = ${match.away_team_id}`);
        if (awayTeam.rows.length > 0) {
          awayTeamName = awayTeam.rows[0].name;
        }
      }

      if (match.competition_id) {
        const competition = await pool.query(`SELECT name FROM competitions WHERE id = ${match.competition_id}`);
        if (competition.rows.length > 0) {
          competitionName = competition.rows[0].name;
        }
      }

      const score = `${match.home_score || '-'} x ${match.away_score || '-'}`;
      const date = new Date(match.match_date).toLocaleDateString('pt-BR');
      
      console.log(`${match.id} | ${homeTeamName} | ${awayTeamName} | ${competitionName} | ${date} | ${match.status} | ${score}`);
    }

  } catch (error) {
    console.error('Erro ao verificar jogos:', error);
  } finally {
    await pool.end();
  }
}

checkLatestMatches(); 