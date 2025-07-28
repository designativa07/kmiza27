const axios = require('axios');

const API_URL = 'http://localhost:3000';
const MATCH_ID = 1505; // ID do jogo que queremos testar

// Token válido (substitua por um token real)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlzQWRtaW4iOnRydWUsImlhdCI6MTczNTM2NTYzMCwiZXhwIjoxNzM1NDUyMDMwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testSaveGoals() {
  console.log('=== TESTE DE SALVAR GOLS ===\n');

  try {
    // 1. Verificar gols existentes antes
    console.log('1. Verificando gols existentes...');
    const { Pool } = require('pg');
    const pool = new Pool({ 
      host: 'localhost', 
      port: 5432, 
      database: 'kmiza27_dev', 
      user: 'admin', 
      password: 'password' 
    });
    
    const existingGoals = await pool.query('SELECT * FROM goals WHERE match_id = $1', [MATCH_ID]);
    console.log('Gols existentes antes:', existingGoals.rows.length);
    existingGoals.rows.forEach(goal => {
      console.log(`  - Player ID: ${goal.player_id}, Team ID: ${goal.team_id}, Type: ${goal.type}`);
    });

    // 2. Preparar dados de gols para enviar
    console.log('\n2. Preparando dados de gols...');
    const goalsData = {
      home_team_player_stats: [
        {
          player_id: 46, // kmiza
          goals: 1,
          yellow_cards: 0,
          red_cards: 0
        }
      ],
      away_team_player_stats: [
        {
          player_id: 47, // kmiza27
          goals: 1,
          yellow_cards: 0,
          red_cards: 0
        }
      ]
    };

    console.log('Dados a serem enviados:', JSON.stringify(goalsData, null, 2));

    // 3. Enviar dados para a API
    console.log('\n3. Enviando dados para a API...');
    try {
      const response = await axios.patch(
        `${API_URL}/amateur/matches/${MATCH_ID}`,
        goalsData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_TOKEN}`
          }
        }
      );
      console.log('✅ Resposta da API:', response.status);
      console.log('Dados retornados:', response.data);
    } catch (error) {
      console.log('❌ Erro ao salvar gols:', error.response?.status, error.response?.data);
      return;
    }

    // 4. Verificar gols após salvar
    console.log('\n4. Verificando gols após salvar...');
    const updatedGoals = await pool.query('SELECT * FROM goals WHERE match_id = $1', [MATCH_ID]);
    console.log('Gols existentes após salvar:', updatedGoals.rows.length);
    updatedGoals.rows.forEach(goal => {
      console.log(`  - Player ID: ${goal.player_id}, Team ID: ${goal.team_id}, Type: ${goal.type}`);
    });

    // 5. Testar API de artilheiros
    console.log('\n5. Testando API de artilheiros...');
    try {
      const topScorersResponse = await axios.get(`${API_URL}/amateur/top-scorers/23`);
      console.log('Artilheiros encontrados:', topScorersResponse.data.length);
      topScorersResponse.data.forEach(scorer => {
        console.log(`  - ${scorer.player_name}: ${scorer.goals} gols`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar artilheiros:', error.response?.status, error.response?.data);
    }

    await pool.end();

  } catch (error) {
    console.error('Erro geral:', error.message);
  }

  console.log('\n=== TESTE FINALIZADO ===');
}

testSaveGoals(); 