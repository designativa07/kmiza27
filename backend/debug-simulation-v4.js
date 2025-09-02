const { Client } = require('pg');

async function debugSimulationV4() {
  console.log('🔍 DEBUG DETALHADO DA SIMULAÇÃO VERSÃO 4.0.0');
  console.log('==============================================\n');

  // Configuração para BASE LOCAL
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'kmiza27_dev',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados LOCAL (kmiza27_dev)');

    // 1. VERIFICAR ÚLTIMA SIMULAÇÃO
    console.log('\n🔍 1. VERIFICANDO ÚLTIMA SIMULAÇÃO');
    
    const latestSimulation = await client.query(`
      SELECT 
        id,
        execution_date,
        algorithm_version,
        simulation_count,
        power_index_data,
        simulation_results
      FROM simulation_results 
      WHERE competition_id = 1
      ORDER BY execution_date DESC
      LIMIT 1
    `);
    
    if (latestSimulation.rows.length === 0) {
      console.log('❌ Nenhuma simulação encontrada');
      return;
    }

    const latest = latestSimulation.rows[0];
    console.log(`📊 ÚLTIMA SIMULAÇÃO:`);
    console.log(`     ID: ${latest.id}`);
    console.log(`     Data: ${latest.execution_date}`);
    console.log(`     Versão: ${latest.algorithm_version}`);
    console.log(`     Simulações: ${latest.simulation_count.toLocaleString()}`);

    // 2. ANÁLISE DETALHADA DO POWER INDEX
    console.log('\n📊 2. ANÁLISE DETALHADA DO POWER INDEX');
    
    if (latest.power_index_data) {
      const powerIndex = latest.power_index_data;
      
      // Ordenar por Power Index
      const sortedPowerIndex = powerIndex.sort((a, b) => b.power_index - a.power_index);
      
      console.log('📊 TOP 10 POWER INDEX:');
      sortedPowerIndex.slice(0, 10).forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.team_name}: ${team.power_index.toFixed(1)}`);
      });
      
      console.log('\n📊 BOTTOM 10 POWER INDEX:');
      sortedPowerIndex.slice(-10).forEach((team, index) => {
        const position = sortedPowerIndex.length - 10 + index + 1;
        console.log(`  ${position}. ${team.team_name}: ${team.power_index.toFixed(1)}`);
      });
      
      // Análise específica do Sport
      const sportPowerIndex = powerIndex.find(team => team.team_name.toLowerCase().includes('sport'));
      if (sportPowerIndex) {
        console.log('\n🎯 SPORT - ANÁLISE DETALHADA:');
        console.log(`     Power Index: ${sportPowerIndex.power_index.toFixed(1)}`);
        console.log(`     Pontos por jogo: ${sportPowerIndex.points_per_game.toFixed(2)}`);
        console.log(`     Saldo de gols por jogo: ${sportPowerIndex.goal_difference_per_game.toFixed(2)}`);
        console.log(`     Forma recente: ${sportPowerIndex.recent_form_score.toFixed(2)}`);
        
        // Calcular Power Index esperado com as correções
        const expectedPowerIndex = 
          (sportPowerIndex.points_per_game / 2.0 * 100) * 0.60 +
          ((Math.max(-1.0, Math.min(1.0, sportPowerIndex.goal_difference_per_game)) + 1.0) / 2.0 * 100) * 0.20 +
          (sportPowerIndex.recent_form_score / 2.0 * 100) * 0.20;
        
        console.log(`     Power Index esperado (v4.0.0): ${expectedPowerIndex.toFixed(1)}`);
        console.log(`     Diferença: ${(expectedPowerIndex - sportPowerIndex.power_index).toFixed(1)}`);
      }
    }

    // 3. ANÁLISE DETALHADA DOS RESULTADOS
    console.log('\n🎲 3. ANÁLISE DETALHADA DOS RESULTADOS');
    
    if (latest.simulation_results) {
      const results = latest.simulation_results;
      
      // Análise do Sport
      const sportData = results.find(team => team.team_name.toLowerCase().includes('sport'));
      if (sportData) {
        console.log('\n🎯 SPORT - RESULTADOS DETALHADOS:');
        console.log(`     Risco de rebaixamento: ${sportData.relegation_probability.toFixed(1)}%`);
        console.log(`     Posição média: ${sportData.average_final_position.toFixed(1)}°`);
        console.log(`     Pontos médios: ${sportData.average_final_points.toFixed(1)}`);
        console.log(`     Posição atual: ${sportData.current_position}º`);
        
        // Análise da distribuição de posições
        if (sportData.position_distribution) {
          console.log('\n📊 DISTRIBUIÇÃO DE POSIÇÕES:');
          Object.entries(sportData.position_distribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .forEach(([position, percentage]) => {
              if (percentage > 0) {
                console.log(`     ${position}º: ${percentage.toFixed(1)}%`);
              }
            });
        }
      }
      
      // Análise geral das probabilidades
      console.log('\n📊 ANÁLISE GERAL DAS PROBABILIDADES:');
      
      const extremeTitle = results.filter(team => team.title_probability > 70);
      const extremeRelegation = results.filter(team => team.relegation_probability > 90);
      const moderateTitle = results.filter(team => team.title_probability > 30 && team.title_probability <= 70);
      const moderateRelegation = results.filter(team => team.relegation_probability > 50 && team.relegation_probability <= 90);
      
      console.log(`     Título extremo (>70%): ${extremeTitle.length} times`);
      console.log(`     Título moderado (30-70%): ${moderateTitle.length} times`);
      console.log(`     Rebaixamento extremo (>90%): ${extremeRelegation.length} times`);
      console.log(`     Rebaixamento moderado (50-90%): ${moderateRelegation.length} times`);
      
      if (extremeTitle.length > 0) {
        console.log('\n⚠️ TIMES COM PROBABILIDADE EXTREMA DE TÍTULO:');
        extremeTitle.forEach(team => {
          console.log(`     ${team.team_name}: ${team.title_probability.toFixed(1)}%`);
        });
      }
      
      if (extremeRelegation.length > 0) {
        console.log('\n⚠️ TIMES COM PROBABILIDADE EXTREMA DE REBAIXAMENTO:');
        extremeRelegation.forEach(team => {
          console.log(`     ${team.team_name}: ${team.relegation_probability.toFixed(1)}%`);
        });
      }
    }

    // 4. ANÁLISE DAS CORREÇÕES IMPLEMENTADAS
    console.log('\n🔧 4. ANÁLISE DAS CORREÇÕES IMPLEMENTADAS');
    
    console.log('📊 CORREÇÕES V4.0.0 IMPLEMENTADAS:');
    console.log('   ✅ Power Index rebalanceado (60% pontos, 20% gols, 20% forma)');
    console.log('   ✅ Bonus de esperança aumentado (0.40-0.60 para times na zona)');
    console.log('   ✅ Volatilidade aumentada para 60%');
    console.log('   ✅ Fator de sobrevivência implementado');
    console.log('   ✅ Posições atualizadas dinamicamente durante simulação');
    console.log('   ✅ Bonus aplicado baseado na posição real');
    
    console.log('\n📊 PARÂMETROS ATUAIS:');
    console.log('   • Volatilidade: 60%');
    console.log('   • Fator de esperança: 2.0x');
    console.log('   • Bonus de esperança: 0.40-0.60 para times na zona');
    console.log('   • Bonus de sobrevivência: 0.20-0.40 para times próximos');

    // 5. DIAGNÓSTICO DO PROBLEMA
    console.log('\n🚨 5. DIAGNÓSTICO DO PROBLEMA');
    
    if (latest.simulation_results) {
      const results = latest.simulation_results;
      const sportData = results.find(team => team.team_name.toLowerCase().includes('sport'));
      
      if (sportData && sportData.relegation_probability > 90) {
        console.log('❌ PROBLEMA IDENTIFICADO:');
        console.log('   • Sport ainda tem 100% de risco');
        console.log('   • Correções estão no código mas não são aplicadas');
        console.log('   • Possíveis causas:');
        console.log('     1. Backend não foi reiniciado corretamente');
        console.log('     2. Cache do sistema está usando versão antiga');
        console.log('     3. Erro na lógica de aplicação dos bonus');
        console.log('     4. Parâmetros muito conservadores');
        
        console.log('\n🔧 SOLUÇÕES:');
        console.log('   1. Verificar se o backend foi realmente reiniciado');
        console.log('   2. Verificar logs do backend para erros');
        console.log('   3. Aumentar agressividade dos bonus');
        console.log('   4. Verificar se há problemas de compilação');
      }
    }

    // 6. PRÓXIMOS PASSOS
    console.log('\n🔄 6. PRÓXIMOS PASSOS');
    
    console.log('🔄 AÇÕES RECOMENDADAS:');
    console.log('   1. Verificar se o backend foi realmente reiniciado');
    console.log('   2. Verificar logs do backend para erros');
    console.log('   3. Aumentar agressividade dos bonus de esperança');
    console.log('   4. Verificar se há problemas na lógica de simulação');
    console.log('   5. Executar nova simulação de teste');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Conexão com banco local fechada');
    }
  }
}

// Executar o debug
debugSimulationV4();



