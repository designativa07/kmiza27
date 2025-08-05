const { Client } = require('pg');

async function checkPool18Settings() {
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

    // Verificar configurações do bolão 18
    const poolInfo = await client.query(`
      SELECT id, name, status, type, round_id, settings
      FROM pools 
      WHERE id = 18
    `);

    console.log('\n📋 Informações do bolão 18:');
    console.log(poolInfo.rows[0]);

    // Verificar se o bolão é público
    const settings = poolInfo.rows[0].settings;
    console.log('\n⚙️ Configurações (settings):', settings);
    
    if (settings) {
      const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
      console.log('📊 Settings parsed:', parsedSettings);
      console.log('🔓 É público?', parsedSettings.public);
    }

    // Verificar participantes novamente
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

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

checkPool18Settings(); 