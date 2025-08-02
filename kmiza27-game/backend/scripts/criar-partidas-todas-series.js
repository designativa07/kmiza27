const axios = require('axios');

const API_BASE_URL = 'http://localhost:3004/api/v1';

async function criarPartidasTodasSeries() {
  console.log('🎯 Criando partidas em todas as séries...\n');

  try {
    // Buscar todas as competições
    const competitionsResponse = await axios.get(`${API_BASE_URL}/competitions`);
    const competitions = competitionsResponse.data.data || [];

    console.log(`📋 Encontradas ${competitions.length} competições`);

    for (const competition of competitions) {
      console.log(`\n🏆 Processando ${competition.name} (Tier ${competition.tier})`);
      
      // Verificar partidas existentes
      try {
        const matchesResponse = await axios.get(`${API_BASE_URL}/competitions/${competition.id}/matches`);
        const existingMatches = matchesResponse.data.data || [];
        
        console.log(`   📅 Partidas existentes: ${existingMatches.length}`);
        
        if (existingMatches.length > 0) {
          console.log(`   ✅ ${competition.name} já tem partidas criadas`);
          continue;
        }
      } catch (error) {
        console.log(`   ⚠️ Erro ao verificar partidas da ${competition.name}:`, error.response?.data?.message || error.message);
      }

      // Verificar classificação para confirmar que há times
      try {
        const standingsResponse = await axios.get(`${API_BASE_URL}/competitions/${competition.id}/standings`);
        const standings = standingsResponse.data.data || [];
        
        console.log(`   👥 Times na classificação: ${standings.length}`);
        
        if (standings.length < 2) {
          console.log(`   ⚠️ ${competition.name} não tem times suficientes para criar partidas`);
          continue;
        }
      } catch (error) {
        console.log(`   ⚠️ Erro ao verificar classificação da ${competition.name}:`, error.response?.data?.message || error.message);
        continue;
      }

      // Tentar criar rodadas para forçar a criação de partidas
      console.log(`   🎯 Criando rodadas para ${competition.name}...`);
      
      const totalRounds = 38; // 19 times = 18 rodadas no turno + 18 no returno = 36 rodadas
      
      for (let round = 1; round <= totalRounds; round++) {
        try {
          await axios.post(`${API_BASE_URL}/competitions/${competition.id}/rounds`, {
            roundNumber: round,
            name: `Rodada ${round}`
          });
        } catch (error) {
          if (error.response?.data?.message?.includes('already exists')) {
            console.log(`   ℹ️ Rodada ${round} já existe`);
          } else {
            console.log(`   ⚠️ Erro ao criar rodada ${round}:`, error.response?.data?.message || error.message);
          }
        }
      }

      // Aguardar um momento e verificar se as partidas foram criadas
      console.log(`   ⏳ Aguardando criação de partidas para ${competition.name}...`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        const finalMatchesResponse = await axios.get(`${API_BASE_URL}/competitions/${competition.id}/matches`);
        const finalMatches = finalMatchesResponse.data.data || [];
        
        console.log(`   📅 Partidas criadas para ${competition.name}: ${finalMatches.length}`);
        
        if (finalMatches.length > 0) {
          console.log(`   ✅ ${competition.name} - Partidas criadas com sucesso!`);
          finalMatches.slice(0, 5).forEach((match, index) => {
            console.log(`      ${index + 1}. ${match.home_team_name} vs ${match.away_team_name} - Rodada ${match.round_number}`);
          });
          if (finalMatches.length > 5) {
            console.log(`      ... e mais ${finalMatches.length - 5} partidas`);
          }
        } else {
          console.log(`   ⚠️ ${competition.name} - Nenhuma partida foi criada automaticamente`);
        }
      } catch (error) {
        console.log(`   ❌ Erro ao verificar partidas finais da ${competition.name}:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Processamento de todas as séries concluído!');
    console.log('📋 Resumo:');
    console.log('   - Todas as séries foram verificadas');
    console.log('   - Rodadas foram criadas onde necessário');
    console.log('   - Partidas devem aparecer no frontend');

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

criarPartidasTodasSeries(); 