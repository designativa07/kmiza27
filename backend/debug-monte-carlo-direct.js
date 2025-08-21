const axios = require('axios');

/**
 * DEBUG DIRETO DO MONTE CARLO
 * 
 * Simular exatamente os passos que o Monte Carlo executa
 * para verificar se os IDs estão sendo lidos corretamente
 */

const API_BASE_URL = 'http://localhost:3000';

async function debugMonteCarloSteps() {
  console.log('🔍 DEBUG DIRETO DO MONTE CARLO');
  console.log('==============================\n');

  try {
    // 1. SIMULAR O QUE O MONTE CARLO FAZ
    console.log('🎯 1. SIMULANDO PASSOS DO MONTE CARLO...');
    
    // Primeiro: buscar Power Index (como o Monte Carlo faz)
    console.log('   Buscando Power Index...');
    
    // O Power Index usa standingsService.getCompetitionStandings(competitionId)
    // Vamos verificar se isso retorna dados corretos
    try {
      const standingsResponse = await axios.get(`${API_BASE_URL}/standings/1`);
      const standings = standingsResponse.data.data || standingsResponse.data;
      
      if (standings && standings.length > 0) {
        console.log(`   ✅ ${standings.length} times encontrados no standings`);
        
        // Verificar Sport especificamente
        const sport = standings.find(s => s.team?.name?.toLowerCase().includes('sport'));
        if (sport) {
          console.log(`   ✅ Sport encontrado no standings:`);
          console.log(`      ID: ${sport.team.id}`);
          console.log(`      Nome: ${sport.team.name}`);
          console.log(`      Pontos: ${sport.points}`);
          console.log(`      Jogos: ${sport.played}`);
        } else {
          console.log('   ❌ Sport NÃO encontrado no standings');
        }
      } else {
        console.log('   ❌ Nenhum standing encontrado');
      }
    } catch (error) {
      console.log('   ❌ Erro ao buscar standings:', error.message);
    }
    
    // 2. VERIFICAR SE MONTE CARLO CONSEGUE CALCULAR POWER INDEX
    console.log('\n🔢 2. VERIFICANDO POWER INDEX...');
    
    try {
      // Simular uma simulação básica para ver os logs
      const simulationResponse = await axios.post(`${API_BASE_URL}/simulations/run`, {
        competitionId: 1,
        simulationCount: 1 // Apenas 1 simulação para debug
      });
      
      if (simulationResponse.data.success) {
        console.log('   ✅ Simulação executada com sucesso');
        
        const powerIndexData = simulationResponse.data.data.power_index_data;
        if (powerIndexData && powerIndexData.length > 0) {
          console.log(`   ✅ Power Index calculado para ${powerIndexData.length} times`);
          
          const sportPowerIndex = powerIndexData.find(p => 
            p.team_name?.toLowerCase().includes('sport')
          );
          
          if (sportPowerIndex) {
            console.log(`   ✅ Sport no Power Index:`);
            console.log(`      ID: ${sportPowerIndex.team_id}`);
            console.log(`      Nome: ${sportPowerIndex.team_name}`);
            console.log(`      Power Index: ${sportPowerIndex.power_index}`);
            console.log(`      Pontos: ${sportPowerIndex.points}`);
            console.log(`      Jogos: ${sportPowerIndex.games_played}`);
          } else {
            console.log('   ❌ Sport NÃO encontrado no Power Index');
          }
        } else {
          console.log('   ❌ Power Index não calculado');
        }
        
        // Verificar resultados da simulação
        const predictions = simulationResponse.data.data.team_predictions;
        if (predictions && predictions.length > 0) {
          console.log(`   ✅ Previsões geradas para ${predictions.length} times`);
          
          const sportPrediction = predictions.find(p => 
            p.team_name?.toLowerCase().includes('sport')
          );
          
          if (sportPrediction) {
            console.log(`   ✅ Sport na simulação:`);
            console.log(`      ID: ${sportPrediction.team_id}`);
            console.log(`      Nome: ${sportPrediction.team_name}`);
            console.log(`      Posição atual: ${sportPrediction.current_position}`);
            console.log(`      Pontos médios: ${sportPrediction.average_final_points}`);
            console.log(`      Risco rebaixamento: ${sportPrediction.relegation_probability}%`);
          } else {
            console.log('   ❌ Sport NÃO encontrado nas previsões');
          }
        } else {
          console.log('   ❌ Previsões não geradas');
        }
        
      } else {
        console.log('   ❌ Falha na simulação:', simulationResponse.data.message);
      }
    } catch (error) {
      console.log('   ❌ Erro na simulação:', error.message);
    }
    
    // 3. VERIFICAR LOGS DO BACKEND
    console.log('\n📋 3. DICAS PARA DEBUG:');
    console.log('   1. Verificar logs do backend para erros durante simulação');
    console.log('   2. Conferir se findAllCompetitionMatches retorna dados corretos');
    console.log('   3. Verificar se calculateInitialStatsFromMatches processa todos os times');
    console.log('   4. Conferir se simulateRemainingMatches encontra jogos para simular');
    
    console.log('\n🔧 4. PRÓXIMOS PASSOS PARA DIAGNÓSTICO:');
    console.log('   1. Adicionar logs no método getRemainingMatches');
    console.log('   2. Adicionar logs no método calculateInitialStatsFromMatches');
    console.log('   3. Verificar se todos os 20 times são processados');
    console.log('   4. Confirmar se jogos futuros são encontrados e simulados');
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error.message);
  }
}

// Executar debug
debugMonteCarloSteps();
