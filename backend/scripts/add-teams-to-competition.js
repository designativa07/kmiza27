const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function addTeamsToCompetition() {
  try {
    console.log('🔍 Associando times à competição amadora...');
    
    const competitionId = 23; // ID da competição "Campeonato Municipal Atualizado"
    
    // 1. Buscar times amadores
    const teamsResponse = await axios.get(`${API_URL}/amateur/teams`);
    console.log('📊 Times amadores encontrados:', teamsResponse.data.length);
    
    if (teamsResponse.data.length === 0) {
      console.log('❌ Nenhum time amador encontrado!');
      return;
    }
    
    // 2. Preparar dados para associar times
    const teamIds = teamsResponse.data.map(team => team.id);
    console.log('🏆 Times a serem associados:', teamIds);
    
    // 3. Associar times à competição
    const addTeamsData = {
      team_ids: teamIds
    };
    
    console.log('📝 Associando times à competição...');
    const addTeamsResponse = await axios.post(`${API_URL}/competitions/${competitionId}/teams`, addTeamsData);
    console.log('✅ Times associados com sucesso!');
    console.log('📊 Resultado:', addTeamsResponse.data);
    
    // 4. Verificar se os times foram associados
    const verifyResponse = await axios.get(`${API_URL}/competitions/${competitionId}/teams`);
    console.log('🏆 Times agora associados:', verifyResponse.data.length);
    
    if (verifyResponse.data.length > 0) {
      console.log('\n📋 Lista de times associados:');
      verifyResponse.data.forEach((team, index) => {
        console.log(`${index + 1}. ${team.team.name}`);
      });
    }
    
    // 5. Verificar classificação
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

addTeamsToCompetition(); 