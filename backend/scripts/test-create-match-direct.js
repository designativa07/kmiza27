const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function testCreateMatchDirect() {
  try {
    console.log('Testando criação direta no banco...');

    // Criar um jogo diretamente no banco
    const result = await pool.query(`
      INSERT INTO matches (
        home_team_id,
        away_team_id,
        competition_id,
        stadium_id,
        match_date,
        status,
        category,
        home_score,
        away_score
      ) VALUES (
        237,
        238,
        23,
        NULL,
        '2024-08-20T19:00:00.000Z',
        'scheduled',
        'amateur',
        NULL,
        NULL
      ) RETURNING id;
    `);

    const matchId = result.rows[0].id;
    console.log('Jogo criado diretamente no banco, ID:', matchId);

    // Verificar se foi criado corretamente
    const checkResult = await pool.query(`
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
      WHERE id = ${matchId};
    `);

    if (checkResult.rows.length > 0) {
      const match = checkResult.rows[0];
      console.log('\n=== JOGO CRIADO DIRETAMENTE ===');
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
    }

  } catch (error) {
    console.error('Erro ao criar jogo diretamente:', error);
  } finally {
    await pool.end();
  }
}

testCreateMatchDirect(); 