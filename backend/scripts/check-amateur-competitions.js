const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function checkAmateurCompetitions() {
  try {
    console.log('🔍 Verificando competições amadoras...');
    
    // 1. Verificar todas as competições
    const allCompetitionsResponse = await axios.get(`${API_URL}/competitions`);
    console.log('📊 Total de competições:', allCompetitionsResponse.data.length);
    
    // 2. Filtrar competições amadoras
    const amateurCompetitions = allCompetitionsResponse.data.filter(comp => comp.category === 'amateur');
    console.log('🏆 Competições amadoras encontradas:', amateurCompetitions.length);
    
    if (amateurCompetitions.length > 0) {
      console.log('\n📋 Lista de competições amadoras:');
      amateurCompetitions.forEach((comp, index) => {
        console.log(`${index + 1}. ${comp.name} (slug: ${comp.slug})`);
      });
      
      // 3. Testar busca por slug
      const firstCompetition = amateurCompetitions[0];
      console.log(`\n🔍 Testando busca por slug: ${firstCompetition.slug}`);
      
      try {
        const slugResponse = await axios.get(`${API_URL}/competitions/slug/${firstCompetition.slug}`);
        console.log('✅ Competição encontrada por slug:', slugResponse.data.name);
        
        // 4. Verificar se há jogos para esta competição
        const matchesResponse = await axios.get(`${API_URL}/amateur/matches?competitionId=${firstCompetition.id}`);
        console.log('⚽ Jogos encontrados:', matchesResponse.data.length);
        
        if (matchesResponse.data.length > 0) {
          console.log('📅 Primeiro jogo:', matchesResponse.data[0]);
        }
        
        // 5. Verificar classificação
        try {
          const standingsResponse = await axios.get(`${API_URL}/standings/competition/${firstCompetition.id}`);
          console.log('🏆 Times na classificação:', standingsResponse.data.length);
        } catch (error) {
          console.log('❌ Erro ao buscar classificação:', error.response?.data || error.message);
        }
        
      } catch (error) {
        console.log('❌ Erro ao buscar por slug:', error.response?.data || error.message);
      }
    } else {
      console.log('❌ Nenhuma competição amadora encontrada!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

checkAmateurCompetitions(); 