const axios = require('axios');

/**
 * TESTE DA SIMULAÇÃO MONTE CARLO V5.0.0
 * 
 * Este script testa a nova versão 5.0.0 do algoritmo Monte Carlo
 * que foi rebalanceado para gerar previsões mais realistas.
 * 
 * MUDANÇAS IMPLEMENTADAS:
 * ✅ Volatilidade reduzida de 40% para 25%
 * ✅ Vantagem de casa reduzida de 15% para 12%
 * ✅ Limites de probabilidade mais realistas (25%-75%)
 * ✅ Fator de tempo: menos bonus com muitos jogos restantes
 * ✅ Probabilidade de empate dinâmica (20%-35%)
 * ✅ Power Index limitado entre 20-90
 * ✅ Bonus de esperança drasticamente reduzidos
 */

const API_BASE_URL = 'http://localhost:3000';

async function testRealisticSimulation() {
  console.log('🧪 TESTANDO SIMULAÇÃO MONTE CARLO V5.0.0');
  console.log('==========================================\n');

  try {
    // 1. EXECUTAR NOVA SIMULAÇÃO
    console.log('🎯 1. EXECUTANDO NOVA SIMULAÇÃO (10.000 iterações)...');
    
    const simulationResponse = await axios.post(`${API_BASE_URL}/simulations/run`, {
      competitionId: 1, // Brasileirão Série A
      simulationCount: 10000
    });

    if (!simulationResponse.data.success) {
      throw new Error('Falha ao executar simulação');
    }

    console.log('✅ Simulação executada com sucesso!');
    console.log(`   Duração: ${simulationResponse.data.data.execution_duration_ms}ms`);
    console.log(`   ID: ${simulationResponse.data.data.id}\n`);

    // 2. BUSCAR RESULTADOS DA SIMULAÇÃO
    console.log('📊 2. ANALISANDO RESULTADOS...');
    
    const latestResponse = await axios.get(`${API_BASE_URL}/simulations/latest/1`);
    
    if (!latestResponse.data.success) {
      throw new Error('Falha ao buscar simulação mais recente');
    }

    const results = latestResponse.data.data.team_predictions;
    
    // 3. ANÁLISE ESPECÍFICA DO SPORT
    console.log('🎯 3. ANÁLISE DO SPORT:');
    const sportData = results.find(team => 
      team.team_name.toLowerCase().includes('sport')
    );
    
    if (sportData) {
      console.log(`   Time: ${sportData.team_name}`);
      console.log(`   Posição atual: ${sportData.current_position}°`);
      console.log(`   Risco de rebaixamento: ${sportData.relegation_probability.toFixed(1)}%`);
      console.log(`   Posição média projetada: ${sportData.average_final_position.toFixed(1)}°`);
      console.log(`   Pontos médios projetados: ${sportData.average_final_points.toFixed(1)}`);
      
      // VALIDAÇÃO: Sport não deve ter 100% de rebaixamento
      if (sportData.relegation_probability >= 95) {
        console.log('❌ PROBLEMA: Sport ainda tem risco quase certo de rebaixamento!');
        console.log('   Esperado: < 80% com 20 rodadas restantes');
      } else if (sportData.relegation_probability >= 80) {
        console.log('⚠️ MELHOROU: Risco alto mas não mais extremo');
      } else {
        console.log('✅ EXCELENTE: Risco realista considerando jogos restantes!');
      }
    } else {
      console.log('❌ Sport não encontrado nos resultados');
    }

    // 4. ANÁLISE GERAL DAS PROBABILIDADES
    console.log('\n📈 4. ANÁLISE GERAL:');
    
    // Top 3 chances de título
    const top3Title = results
      .sort((a, b) => b.title_probability - a.title_probability)
      .slice(0, 3);
    
    console.log('\n🏆 TOP 3 - CHANCES DE TÍTULO:');
    top3Title.forEach((team, index) => {
      console.log(`   ${index + 1}º ${team.team_name}: ${team.title_probability.toFixed(1)}%`);
    });

    // Top 3 risco de rebaixamento
    const top3Relegation = results
      .sort((a, b) => b.relegation_probability - a.relegation_probability)
      .slice(0, 3);
    
    console.log('\n⬇️ TOP 3 - RISCO DE REBAIXAMENTO:');
    top3Relegation.forEach((team, index) => {
      console.log(`   ${index + 1}º ${team.team_name}: ${team.relegation_probability.toFixed(1)}%`);
    });

    // 5. VALIDAÇÃO DAS MELHORIAS
    console.log('\n🔍 5. VALIDAÇÃO DAS MELHORIAS:');
    
    // Contar probabilidades extremas
    const extremeTitle = results.filter(team => team.title_probability > 60);
    const extremeRelegation = results.filter(team => team.relegation_probability > 85);
    
    console.log(`   Times com >60% de título: ${extremeTitle.length} (ideal: ≤2)`);
    console.log(`   Times com >85% de rebaixamento: ${extremeRelegation.length} (ideal: ≤1)`);
    
    if (extremeTitle.length <= 2) {
      console.log('✅ Probabilidades de título mais equilibradas!');
    } else {
      console.log('⚠️ Ainda há muitos favoritos extremos ao título');
    }
    
    if (extremeRelegation.length <= 1) {
      console.log('✅ Probabilidades de rebaixamento mais realistas!');
    } else {
      console.log('⚠️ Ainda há muitos times com risco extremo');
    }

    // 6. ANÁLISE DE DISTRIBUIÇÃO
    console.log('\n📊 6. DISTRIBUIÇÃO DE PROBABILIDADES:');
    
    const titleStats = {
      high: results.filter(t => t.title_probability > 30).length,
      medium: results.filter(t => t.title_probability > 10 && t.title_probability <= 30).length,
      low: results.filter(t => t.title_probability > 0 && t.title_probability <= 10).length
    };
    
    const relegationStats = {
      high: results.filter(t => t.relegation_probability > 60).length,
      medium: results.filter(t => t.relegation_probability > 20 && t.relegation_probability <= 60).length,
      low: results.filter(t => t.relegation_probability <= 20).length
    };
    
    console.log(`   TÍTULO - Alto (>30%): ${titleStats.high}, Médio (10-30%): ${titleStats.medium}, Baixo (<10%): ${titleStats.low}`);
    console.log(`   REBAIXAMENTO - Alto (>60%): ${relegationStats.high}, Médio (20-60%): ${relegationStats.medium}, Baixo (<20%): ${relegationStats.low}`);

    // 7. CONCLUSÃO
    console.log('\n🎉 7. CONCLUSÃO:');
    console.log('================');
    
    if (sportData && sportData.relegation_probability < 80) {
      console.log('✅ SIMULAÇÃO V5.0.0 APROVADA!');
      console.log('   • Sport com risco realista de rebaixamento');
      console.log('   • Probabilidades mais equilibradas');
      console.log('   • Algoritmo considera tempo restante adequadamente');
    } else {
      console.log('⚠️ SIMULAÇÃO MELHOROU MAS AINDA PRECISA AJUSTES');
      console.log('   • Verificar se o backend foi reiniciado');
      console.log('   • Considerar reduzir ainda mais os fatores de volatilidade');
    }

    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   1. Validar no frontend que os números estão realistas');
    console.log('   2. Executar mais simulações para confirmar consistência');
    console.log('   3. Monitorar se as previsões se mantêm equilibradas');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
    
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('   1. Verificar se o backend está rodando na porta 3000');
    console.log('   2. Verificar se as alterações foram salvas');
    console.log('   3. Reiniciar o backend para carregar as mudanças');
  }
}

// Executar o teste
testRealisticSimulation();
