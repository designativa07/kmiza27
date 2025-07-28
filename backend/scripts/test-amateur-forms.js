const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'seu_token_aqui';

async function testAmateurAPIs() {
  console.log('=== TESTE DAS APIS AMADORAS ===');
  
  try {
    // Testar busca de competições
    console.log('\n1. Testando busca de competições...');
    try {
      const competitionsResponse = await axios.get(`${API_URL}/amateur/competitions`, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ Competições encontradas:', competitionsResponse.data.length);
      console.log('Primeira competição:', competitionsResponse.data[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar competições:', error.response?.status, error.response?.data);
    }

    // Testar busca de times
    console.log('\n2. Testando busca de times...');
    try {
      const teamsResponse = await axios.get(`${API_URL}/amateur/teams`, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ Times encontrados:', teamsResponse.data.length);
      console.log('Primeiro time:', teamsResponse.data[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar times:', error.response?.status, error.response?.data);
    }

    // Testar busca de estádios
    console.log('\n3. Testando busca de estádios...');
    try {
      const stadiumsResponse = await axios.get(`${API_URL}/amateur/stadiums`);
      console.log('✅ Estádios encontrados:', stadiumsResponse.data.length);
      console.log('Primeiro estádio:', stadiumsResponse.data[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar estádios:', error.response?.status, error.response?.data);
    }

    // Testar busca de jogos
    console.log('\n4. Testando busca de jogos...');
    try {
      const matchesResponse = await axios.get(`${API_URL}/amateur/matches`, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ Jogos encontrados:', matchesResponse.data.length);
      if (matchesResponse.data.length > 0) {
        console.log('Primeiro jogo:', matchesResponse.data[0]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar jogos:', error.response?.status, error.response?.data);
    }

    // Testar criação de jogo
    console.log('\n5. Testando criação de jogo...');
    try {
      const matchData = {
        home_team_id: 1,
        away_team_id: 2,
        competition_id: 1,
        stadium_id: null,
        match_date: '2024-12-20T19:00:00.000Z',
        status: 'scheduled',
        home_score: null,
        away_score: null
      };

      const createResponse = await axios.post(`${API_URL}/amateur/matches`, matchData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log('✅ Jogo criado com sucesso:', createResponse.data);
      
      // Testar busca do jogo criado
      const matchId = createResponse.data.id;
      console.log('\n6. Testando busca do jogo criado...');
      const getMatchResponse = await axios.get(`${API_URL}/amateur/matches/${matchId}`, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ Jogo encontrado:', getMatchResponse.data);

      // Testar atualização do jogo
      console.log('\n7. Testando atualização do jogo...');
      const updateData = {
        home_score: 2,
        away_score: 1,
        status: 'finished'
      };

      const updateResponse = await axios.patch(`${API_URL}/amateur/matches/${matchId}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log('✅ Jogo atualizado com sucesso:', updateResponse.data);

    } catch (error) {
      console.error('❌ Erro ao criar/atualizar jogo:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testAmateurAPIs(); 