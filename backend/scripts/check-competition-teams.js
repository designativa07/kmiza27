const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function checkCompetitionTeams() {
  try {
    console.log('🔍 Verificando times da competição amadora...');
    
    const competitionId = 23; // ID da competição "Campeonato Municipal Atualizado"
    
    // 1. Verificar times da competição
    const teamsResponse = await axios.get(`${API_URL}/competitions/${competitionId}/teams`);
    console.log('🏆 Times associados à competição:', teamsResponse.data.length);
    
    if (teamsResponse.data.length > 0) {
      console.log('\n📋 Lista de times:');
      teamsResponse.data.forEach((team, index) => {
        console.log(`${index + 1}. ${team.team.name}`);
      });
    } else {
      console.log('❌ Nenhum time associado à competição!');
      
      // 2. Verificar times amadores disponíveis
      const amateurTeamsResponse = await axios.get(`${API_URL}/amateur/teams`);
      console.log('\n📊 Times amadores disponíveis:', amateurTeamsResponse.data.length);
      
      if (amateurTeamsResponse.data.length > 0) {
        console.log('\n📋 Lista de times amadores:');
        amateurTeamsResponse.data.forEach((team, index) => {
          console.log(`${index + 1}. ${team.name} (ID: ${team.id})`);
        });
      }
    }
    
    // 3. Verificar classificação
    try {
      const standingsResponse = await axios.get(`${API_URL}/standings/competition/${competitionId}`);
      console.log('\n🏆 Times na classificação:', standingsResponse.data.length);
    } catch (error) {
      console.log('❌ Erro ao buscar classificação:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

checkCompetitionTeams(); 