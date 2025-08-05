const { Client } = require('pg');

async function testFindOneQuery() {
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

    // Simular a consulta do TypeORM findOne
    const query = `
      SELECT 
        pool.id,
        pool.name,
        pool.status,
        pool.type,
        pool.settings,
        pool.created_by_user_id,
        pool.created_at,
        pool.updated_at,
        creator.id as creator_id,
        creator.name as creator_name,
        creator.email as creator_email,
        participants.id as participant_id,
        participants.user_id as participant_user_id,
        participants.total_points,
        participants.ranking_position,
        participants.predictions_count,
        participants.exact_predictions,
        participants.correct_results,
        participant_user.id as participant_user_id_2,
        participant_user.name as participant_user_name,
        participant_user.email as participant_user_email
      FROM pools pool
      LEFT JOIN users creator ON pool.created_by_user_id = creator.id
      LEFT JOIN pool_participants participants ON pool.id = participants.pool_id
      LEFT JOIN users participant_user ON participants.user_id = participant_user.id
      WHERE pool.id = 18
      ORDER BY participants.ranking_position
    `;

    const result = await client.query(query);
    
    console.log('\n📋 Resultado da consulta:');
    console.log('Total de linhas:', result.rows.length);
    
    if (result.rows.length > 0) {
      const pool = result.rows[0];
      console.log('\n🏆 Informações do bolão:');
      console.log('ID:', pool.id);
      console.log('Nome:', pool.name);
      console.log('Status:', pool.status);
      console.log('Settings:', pool.settings);
      console.log('Criador:', pool.creator_name);
      
      // Agrupar participantes
      const participants = result.rows
        .filter(row => row.participant_id)
        .map(row => ({
          id: row.participant_id,
          user_id: row.participant_user_id,
          total_points: row.total_points,
          ranking_position: row.ranking_position,
          predictions_count: row.predictions_count,
          exact_predictions: row.exact_predictions,
          correct_results: row.correct_results,
          user: {
            id: row.participant_user_id_2,
            name: row.participant_user_name,
            email: row.participant_user_email
          }
        }));
      
      console.log('\n👥 Participantes encontrados:', participants.length);
      participants.forEach((p, index) => {
        console.log(`${index + 1}. ${p.user.name} (ID: ${p.user_id}) - ${p.total_points} pontos`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

testFindOneQuery(); 