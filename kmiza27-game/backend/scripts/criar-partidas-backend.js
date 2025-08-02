const axios = require('axios');

const API_BASE_URL = 'http://localhost:3004/api/v1';
const COMPETITION_ID = '045a3b64-59fc-48fd-ad8f-828b4f1a5319'; // Série D

async function criarPartidasBackend() {
  console.log('🎯 Criando partidas via API do backend...\n');

  try {
    // Primeiro, verificar se há partidas existentes
    console.log('📋 Verificando partidas existentes...');
    
    const matchesResponse = await axios.get(`${API_BASE_URL}/competitions/${COMPETITION_ID}/matches`);
    const existingMatches = matchesResponse.data.data || [];
    
    console.log(`📅 Partidas existentes: ${existingMatches.length}`);
    
    if (existingMatches.length > 0) {
      console.log('✅ Série D já tem partidas criadas!');
      return;
    }

    // Verificar classificação
    console.log('\n📊 Verificando classificação...');
    
    const standingsResponse = await axios.get(`${API_BASE_URL}/competitions/${COMPETITION_ID}/standings`);
    const standings = standingsResponse.data.data || [];
    
    console.log(`👥 Times na classificação: ${standings.length}`);
    
    if (standings.length < 2) {
      console.log('❌ Não há times suficientes na classificação');
      console.log('💡 Vamos tentar criar partidas mesmo assim...');
    }

    // Criar rodadas
    console.log('\n🎯 Criando rodadas...');
    
    const totalRounds = 38;
    let roundsCreated = 0;
    
    for (let round = 1; round <= totalRounds; round++) {
      try {
        await axios.post(`${API_BASE_URL}/competitions/${COMPETITION_ID}/rounds`, {
          roundNumber: round,
          name: `Rodada ${round}`
        });
        roundsCreated++;
        console.log(`   ✅ Rodada ${round} criada`);
      } catch (error) {
        if (error.response?.data?.message?.includes('already exists')) {
          console.log(`   ℹ️ Rodada ${round} já existe`);
        } else {
          console.log(`   ⚠️ Erro ao criar rodada ${round}:`, error.response?.data?.message || error.message);
        }
      }
    }

    console.log(`\n✅ Criadas ${roundsCreated} rodadas`);

    // Aguardar e verificar se as partidas foram criadas automaticamente
    console.log('\n⏳ Aguardando criação automática de partidas...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const finalMatchesResponse = await axios.get(`${API_BASE_URL}/competitions/${COMPETITION_ID}/matches`);
    const finalMatches = finalMatchesResponse.data.data || [];
    
    console.log(`\n📅 Partidas criadas: ${finalMatches.length}`);
    
    if (finalMatches.length > 0) {
      console.log('✅ Partidas criadas com sucesso!');
      finalMatches.slice(0, 10).forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.home_team_name} vs ${match.away_team_name} - Rodada ${match.round_number}`);
      });
      if (finalMatches.length > 10) {
        console.log(`   ... e mais ${finalMatches.length - 10} partidas`);
      }
    } else {
      console.log('⚠️ Nenhuma partida foi criada automaticamente');
      console.log('💡 As partidas devem aparecer no frontend após a criação das rodadas');
    }

    console.log('\n🎉 Processo concluído!');
    console.log('📋 Resumo:');
    console.log(`   - Rodadas criadas: ${roundsCreated}`);
    console.log(`   - Partidas criadas: ${finalMatches.length}`);
    console.log('   - Verifique o frontend para ver as partidas');

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

criarPartidasBackend(); 