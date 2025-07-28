const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkMatch1481() {
  try {
    console.log('Verificando jogo 1481...');

    // Buscar o jogo 1481
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
        category
      FROM matches 
      WHERE id = 1481;
    `);

    if (result.rows.length > 0) {
      const match = result.rows[0];
      console.log('\n=== JOGO 1481 ===');
      console.log(`ID: ${match.id}`);
      console.log(`Home Team ID: ${match.home_team_id}`);
      console.log(`Away Team ID: ${match.away_team_id}`);
      console.log(`Competition ID: ${match.competition_id}`);
      console.log(`Stadium ID: ${match.stadium_id}`);
      console.log(`Match Date: ${match.match_date}`);
      console.log(`Status: ${match.status}`);
      console.log(`Home Score: ${match.home_score}`);
      console.log(`Away Score: ${match.away_score}`);
      console.log(`Category: ${match.category}`);

      // Verificar se os times existem
      if (match.home_team_id) {
        const homeTeam = await pool.query(`
          SELECT id, name FROM teams WHERE id = ${match.home_team_id}
        `);
        if (homeTeam.rows.length > 0) {
          console.log(`Home Team: ${homeTeam.rows[0].name}`);
        } else {
          console.log('Home Team: NÃO ENCONTRADO');
        }
      }

      if (match.away_team_id) {
        const awayTeam = await pool.query(`
          SELECT id, name FROM teams WHERE id = ${match.away_team_id}
        `);
        if (awayTeam.rows.length > 0) {
          console.log(`Away Team: ${awayTeam.rows[0].name}`);
        } else {
          console.log('Away Team: NÃO ENCONTRADO');
        }
      }

      if (match.competition_id) {
        const competition = await pool.query(`
          SELECT id, name FROM competitions WHERE id = ${match.competition_id}
        `);
        if (competition.rows.length > 0) {
          console.log(`Competition: ${competition.rows[0].name}`);
        } else {
          console.log('Competition: NÃO ENCONTRADA');
        }
      }

    } else {
      console.log('\nJogo 1481 não encontrado.');
    }

  } catch (error) {
    console.error('Erro ao verificar jogo:', error);
  } finally {
    await pool.end();
  }
}

checkMatch1481(); 