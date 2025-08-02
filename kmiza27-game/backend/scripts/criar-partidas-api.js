const axios = require('axios');

const API_BASE_URL = 'http://localhost:3004/api/v1';

async function criarPartidasViaAPI() {
  console.log('🎯 Criando partidas via API...\n');

  const competitionId = '045a3b64-59fc-48fd-ad8f-828b4f1a5319'; // Série D

  try {
    // Primeiro, verificar se há times suficientes
    console.log('📋 Verificando times na competição...');
    
    const standingsResponse = await axios.get(`${API_BASE_URL}/competitions/${competitionId}/standings`);
    console.log('✅ Classificação carregada');

    // Buscar partidas existentes
    const matchesResponse = await axios.get(`${API_BASE_URL}/competitions/${competitionId}/matches`);
    console.log('📅 Partidas existentes:', matchesResponse.data.data ? matchesResponse.data.data.length : 0);

    if (matchesResponse.data.data && matchesResponse.data.data.length > 0) {
      console.log('✅ Partidas já existem!');
      return;
    }

    // Forçar criação de partidas chamando o método interno
    console.log('🎯 Forçando criação de partidas...');
    
    // Simular uma inscrição para acionar a criação de partidas
    const testTeamId = 'b3f0689d-80b5-4a38-a62f-16aaadf6e7e7'; // Botafogo
    
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/competitions/${competitionId}/register`, {
        teamId: testTeamId
      });
      console.log('✅ Inscrição forçada realizada');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message === 'Competição está cheia') {
        console.log('ℹ️ Competição está cheia, mas isso é esperado');
      } else {
        console.error('❌ Erro na inscrição forçada:', error.response?.data || error.message);
      }
    }

    // Aguardar um momento e verificar se as partidas foram criadas
    console.log('⏳ Aguardando criação de partidas...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalMatchesResponse = await axios.get(`${API_BASE_URL}/competitions/${competitionId}/matches`);
    const finalMatches = finalMatchesResponse.data.data || [];
    
    console.log(`📅 Partidas criadas: ${finalMatches.length}`);
    
    if (finalMatches.length > 0) {
      console.log('✅ Partidas criadas com sucesso!');
      finalMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.home_team_name} vs ${match.away_team_name} - Rodada ${match.round_number}`);
      });
    } else {
      console.log('⚠️ Nenhuma partida foi criada automaticamente');
      console.log('💡 Tentando criar partidas manualmente...');
      
      // Tentar criar rodadas primeiro
      for (let round = 1; round <= 38; round++) {
        try {
          await axios.post(`${API_BASE_URL}/competitions/${competitionId}/rounds`, {
            roundNumber: round,
            name: `Rodada ${round}`
          });
        } catch (error) {
          console.log(`⚠️ Rodada ${round} já existe ou erro:`, error.response?.data?.message || error.message);
        }
      }
      
      console.log('✅ Rodadas criadas, agora as partidas devem aparecer no frontend');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

criarPartidasViaAPI(); 