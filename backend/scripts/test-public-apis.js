const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testPublicAPIs() {
  try {
    console.log('🔍 Testando APIs públicas...');
    
    const competitionSlug = 'campeonato-municipal-atualizado';
    const competitionId = 23;
    
    // 1. Testar busca de competição por slug
    console.log('\n1. Testando busca de competição por slug...');
    try {
      const competitionResponse = await axios.get(`${API_URL}/competitions/slug/${competitionSlug}`);
      console.log('✅ Competição encontrada:', competitionResponse.data.name);
    } catch (error) {
      console.log('❌ Erro ao buscar competição:', error.response?.data || error.message);
    }
    
    // 2. Testar busca de rodadas
    console.log('\n2. Testando busca de rodadas...');
    try {
      const roundsResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}/rounds`);
      console.log('✅ Rodadas encontradas:', roundsResponse.data.length);
      if (roundsResponse.data.length > 0) {
        console.log('📋 Rodadas:', roundsResponse.data.map(r => r.name));
      }
    } catch (error) {
      console.log('❌ Erro ao buscar rodadas:', error.response?.data || error.message);
    }
    
    // 3. Testar busca de jogos por rodada
    console.log('\n3. Testando busca de jogos por rodada...');
    try {
      const matchesResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}/round/1/matches`);
      console.log('✅ Jogos encontrados:', matchesResponse.data.length);
      if (matchesResponse.data.length > 0) {
        console.log('📅 Primeiro jogo:', matchesResponse.data[0].home_team.name + ' vs ' + matchesResponse.data[0].away_team.name);
      }
    } catch (error) {
      console.log('❌ Erro ao buscar jogos:', error.response?.data || error.message);
    }
    
    // 4. Testar classificação
    console.log('\n4. Testando classificação...');
    try {
      const standingsResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}`);
      console.log('✅ Times na classificação:', standingsResponse.data.length);
      if (standingsResponse.data.length > 0) {
        console.log('📋 Times:', standingsResponse.data.map(s => s.team.name));
      }
    } catch (error) {
      console.log('❌ Erro ao buscar classificação:', error.response?.data || error.message);
    }
    
    // 5. Testar artilharia
    console.log('\n5. Testando artilharia...');
    try {
      const topScorersResponse = await axios.get(`${API_URL}/competitions/${competitionId}/top-scorers`);
      console.log('✅ Artilheiros encontrados:', topScorersResponse.data.length);
      if (topScorersResponse.data.length > 0) {
        console.log('⚽ Top artilheiro:', topScorersResponse.data[0].player.name + ' (' + topScorersResponse.data[0].goals + ' gols)');
      }
    } catch (error) {
      console.log('❌ Erro ao buscar artilharia:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testPublicAPIs(); 