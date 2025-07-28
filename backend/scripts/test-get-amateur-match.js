const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testGetAmateurMatch() {
  try {
    console.log('Testando busca de jogo amador...');

    // Primeiro, buscar todos os jogos amadores
    const response = await axios.get(`${API_URL}/amateur/matches`);
    console.log('Status da resposta:', response.status);
    console.log('Jogos encontrados:', response.data.length);

    if (response.data.length > 0) {
      const lastMatch = response.data[response.data.length - 1];
      console.log('Último jogo:', lastMatch);

      // Testar buscar um jogo específico
      const matchResponse = await axios.get(`${API_URL}/amateur/matches/${lastMatch.id}`);
      console.log('Status da busca específica:', matchResponse.status);
      console.log('Jogo específico:', matchResponse.data);
    }

  } catch (error) {
    console.error('Erro ao buscar jogo:', error.response?.status, error.response?.data);
  }
}

testGetAmateurMatch(); 