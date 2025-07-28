const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testStandingsAPIs() {
  try {
    console.log('🔍 Testando APIs de Standings...');
    
    const competitionId = 23;
    
    // 1. Testar classificação
    console.log('\n1. Testando classificação...');
    try {
      const standingsResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}`);
      console.log('✅ Classificação encontrada:', standingsResponse.data.length, 'times');
      if (standingsResponse.data.length > 0) {
        console.log('📋 Primeiro time:', standingsResponse.data[0].team.name);
      }
    } catch (error) {
      console.log('❌ Erro na classificação:', error.response?.status, error.response?.data || error.message);
    }
    
    // 2. Testar rodadas
    console.log('\n2. Testando rodadas...');
    try {
      const roundsResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}/rounds`);
      console.log('✅ Rodadas encontradas:', roundsResponse.data.length);
      if (roundsResponse.data.length > 0) {
        console.log('📋 Primeira rodada:', roundsResponse.data[0]);
      }
    } catch (error) {
      console.log('❌ Erro nas rodadas:', error.response?.status, error.response?.data || error.message);
    }
    
    // 3. Testar jogos da competição
    console.log('\n3. Testando jogos da competição...');
    try {
      const matchesResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}/matches`);
      console.log('✅ Jogos encontrados:', matchesResponse.data.length);
      if (matchesResponse.data.length > 0) {
        console.log('📅 Primeiro jogo:', matchesResponse.data[0].home_team.name + ' vs ' + matchesResponse.data[0].away_team.name);
      }
    } catch (error) {
      console.log('❌ Erro nos jogos:', error.response?.status, error.response?.data || error.message);
    }
    
    // 4. Testar grupos
    console.log('\n4. Testando grupos...');
    try {
      const groupsResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}/groups`);
      console.log('✅ Grupos encontrados:', groupsResponse.data.length);
      if (groupsResponse.data.length > 0) {
        console.log('📋 Grupos:', groupsResponse.data);
      }
    } catch (error) {
      console.log('❌ Erro nos grupos:', error.response?.status, error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testStandingsAPIs(); 