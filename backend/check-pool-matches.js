const { Client } = require('pg');

async function checkPoolMatches() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'kmiza27_dev',
    user: 'admin',
    password: 'password'
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Verificar informações do bolão
    const poolInfo = await client.query(`
      SELECT id, name, status, type, round_id
      FROM pools 
      WHERE id = 17
    `);

    console.log('\n📋 Informações do bolão 17:');
    console.log(poolInfo.rows[0]);

    // Verificar jogos do bolão
    const poolMatches = await client.query(`
      SELECT pm.id, pm.match_id, pm.order_index,
             m.home_team_id, m.away_team_id, m.match_date, m.status,
             ht.name as home_team_name,
             at.name as away_team_name
      FROM pool_matches pm
      JOIN matches m ON pm.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE pm.pool_id = 17
      ORDER BY pm.order_index
    `);

    console.log('\n🎮 Jogos do bolão 17:');
    poolMatches.rows.forEach((match, index) => {
      console.log(`${index + 1}. ID: ${match.match_id} - ${match.home_team_name} vs ${match.away_team_name} (${match.match_date})`);
    });

    // Verificar palpites existentes
    const predictions = await client.query(`
      SELECT pp.match_id, pp.predicted_home_score, pp.predicted_away_score, pp.predicted_at
      FROM pool_predictions pp
      WHERE pp.pool_id = 17 AND pp.user_id = 19
      ORDER BY pp.match_id
    `);

    console.log('\n🎯 Palpites existentes do usuário 19:');
    predictions.rows.forEach(pred => {
      console.log(`Jogo ${pred.match_id}: ${pred.predicted_home_score} x ${pred.predicted_away_score} (${pred.predicted_at})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

checkPoolMatches(); 