const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testAmateurRoutes() {
  try {
    console.log('Testando rotas amateur...');

    // Testar GET /amateur/competitions
    console.log('\n1. Testando GET /amateur/competitions...');
    try {
      const response = await axios.get(`${API_URL}/amateur/competitions`);
      console.log('Status:', response.status);
      console.log('Dados:', response.data.length, 'competições encontradas');
    } catch (error) {
      console.error('Erro:', error.response?.status, error.response?.data);
    }

    // Testar GET /amateur/teams
    console.log('\n2. Testando GET /amateur/teams...');
    try {
      const response = await axios.get(`${API_URL}/amateur/teams`);
      console.log('Status:', response.status);
      console.log('Dados:', response.data.length, 'times encontrados');
    } catch (error) {
      console.error('Erro:', error.response?.status, error.response?.data);
    }

    // Testar GET /amateur/matches
    console.log('\n3. Testando GET /amateur/matches...');
    try {
      const response = await axios.get(`${API_URL}/amateur/matches`);
      console.log('Status:', response.status);
      console.log('Dados:', response.data.length, 'jogos encontrados');
    } catch (error) {
      console.error('Erro:', error.response?.status, error.response?.data);
    }

    // Testar POST /amateur/matches (com autenticação)
    console.log('\n4. Testando POST /amateur/matches (com auth)...');
    try {
      const matchData = {
        home_team_id: 237,
        away_team_id: 238,
        competition_id: 23,
        stadium_id: null,
        match_date: '2024-08-20T19:00:00.000Z',
        status: 'scheduled',
        home_score: null,
        away_score: null
      };

      const response = await axios.post(`${API_URL}/amateur/matches`, matchData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log('Status:', response.status);
      console.log('Jogo criado:', response.data.id);
    } catch (error) {
      console.error('Erro:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testAmateurRoutes(); 