const { Client } = require('pg');

async function checkPool18Participation() {
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

    // Verificar informações do bolão 18
    const poolInfo = await client.query(`
      SELECT id, name, status, type, round_id
      FROM pools 
      WHERE id = 18
    `);

    console.log('\n📋 Informações do bolão 18:');
    console.log(poolInfo.rows[0]);

    // Verificar participantes do bolão
    const participants = await client.query(`
      SELECT pp.user_id, pp.total_points, pp.ranking_position,
             u.name as user_name, u.email
      FROM pool_participants pp
      JOIN users u ON pp.user_id = u.id
      WHERE pp.pool_id = 18
      ORDER BY pp.ranking_position
    `);

    console.log('\n👥 Participantes do bolão 18:');
    participants.rows.forEach((participant, index) => {
      console.log(`${index + 1}. ${participant.user_name} (${participant.email}) - ${participant.total_points} pontos`);
    });

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
      WHERE pm.pool_id = 18
      ORDER BY pm.order_index
    `);

    console.log('\n🎮 Jogos do bolão 18:');
    poolMatches.rows.forEach((match, index) => {
      console.log(`${index + 1}. ID: ${match.match_id} - ${match.home_team_name} vs ${match.away_team_name} (${match.match_date})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

checkPool18Participation(); 