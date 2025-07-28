const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkMatchScores() {
  try {
    console.log('Verificando scores dos jogos amadores...');

    // Buscar todos os jogos amadores com scores
    const result = await pool.query(`
      SELECT 
        id,
        home_score,
        away_score,
        status,
        match_date,
        home_team_id,
        away_team_id
      FROM matches 
      WHERE category = 'amateur'
      ORDER BY id DESC
      LIMIT 10;
    `);

    console.log('\nJogos amadores encontrados:');
    console.log('ID | Home Score | Away Score | Status | Data | Home Team | Away Team');
    console.log('---|------------|------------|--------|------|-----------|-----------');
    
    result.rows.forEach(row => {
      console.log(`${row.id} | ${row.home_score || '-'} | ${row.away_score || '-'} | ${row.status} | ${row.match_date} | ${row.home_team_id} | ${row.away_team_id}`);
    });

    // Verificar especificamente o jogo 1453
    const match1453 = await pool.query(`
      SELECT 
        id,
        home_score,
        away_score,
        status,
        match_date,
        home_team_id,
        away_team_id
      FROM matches 
      WHERE id = 1453;
    `);

    if (match1453.rows.length > 0) {
      const match = match1453.rows[0];
      console.log('\n=== JOGO 1453 ===');
      console.log(`ID: ${match.id}`);
      console.log(`Home Score: ${match.home_score}`);
      console.log(`Away Score: ${match.away_score}`);
      console.log(`Status: ${match.status}`);
      console.log(`Data: ${match.match_date}`);
      console.log(`Home Team ID: ${match.home_team_id}`);
      console.log(`Away Team ID: ${match.away_team_id}`);
    } else {
      console.log('\nJogo 1453 não encontrado.');
    }

  } catch (error) {
    console.error('Erro ao verificar scores:', error);
  } finally {
    await pool.end();
  }
}

checkMatchScores(); 