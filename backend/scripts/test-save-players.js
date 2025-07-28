const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Token de teste (você pode substituir por um token válido)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFtYWRvckBnbWFpbC5jb20iLCJzdWIiOjUyLCJpc19hZG1pbiI6ZmFsc2UsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNjU3NjY4LCJleHAiOjE3NTM3NDQwNjh9.placeholder';

async function testSavePlayers() {
  console.log('=== TESTANDO SALVAMENTO DE JOGADORES ===\n');

  try {
    // 1. Testar POST /amateur/teams/238/players com token
    console.log('1. Testando POST /amateur/teams/238/players...');
    try {
      const testTeamPlayers = [
        {
          player_id: 45, // Zé da Silva
          team_id: 238,
          jersey_number: '1',
          role: 'Goleiro',
          start_date: '2024-01-01'
        },
        {
          player_id: 47, // kmiza27
          team_id: 238,
          jersey_number: '10',
          role: 'Capitão',
          start_date: '2024-01-01'
        }
      ];
      
      const postTeamPlayersResponse = await axios.post(`${API_URL}/amateur/teams/238/players`, {
        team_players: testTeamPlayers
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Jogadores salvos:', postTeamPlayersResponse.data);
    } catch (error) {
      console.log('❌ Erro ao salvar jogadores:', error.response?.status, error.response?.data?.message);
    }

    // 2. Testar GET /amateur/teams/238/players para verificar se foram salvos
    console.log('\n2. Testando GET /amateur/teams/238/players...');
    try {
      const teamPlayersResponse = await axios.get(`${API_URL}/amateur/teams/238/players`);
      console.log('✅ Jogadores do time encontrados:', teamPlayersResponse.data.length);
      console.log('Dados:', teamPlayersResponse.data);
    } catch (error) {
      console.log('❌ Erro ao buscar jogadores do time:', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.error('Erro geral:', error.message);
  }

  console.log('\n=== TESTE FINALIZADO ===');
}

testSavePlayers(); 