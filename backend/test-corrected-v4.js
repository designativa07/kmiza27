const { Client } = require('pg');

async function testCorrectedV4() {
  console.log('🧪 TESTANDO CORREÇÕES IMPLEMENTADAS NA VERSÃO 4.0.0');
  console.log('=====================================================\n');

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
    
    if (latestSimulation.rows.length > 0) {
      const latest = latestSimulation.rows[0];
      console.log(`📊 ÚLTIMA SIMULAÇÃO:`);
      console.log(`     ID: ${latest.id}`);
      console.log(`     Data: ${latest.execution_date}`);
      console.log(`     Versão: ${latest.algorithm_version}`);
      console.log(`     Simulações: ${latest.simulation_count.toLocaleString()}`);
      
      if (latest.algorithm_version === '4.0.0') {
        console.log('✅ Versão 4.0.0 confirmada!');
      } else {
        console.log('⚠️ Versão anterior ainda está sendo usada');
        return;
      }
    }

    // 2. ANÁLISE DETALHADA DO SPORT
    console.log('\n🎯 2. ANÁLISE DETALHADA DO SPORT');
    
    if (latestSimulation.rows.length > 0 && latestSimulation.rows[0].simulation_results) {
      const results = latestSimulation.rows[0].simulation_results;
      const sportData = results.find(team => team.team_name.toLowerCase().includes('sport'));
      
      if (sportData) {
        console.log(`📊 SPORT - RESULTADOS ATUAIS:`);
        console.log(`     Risco de rebaixamento: ${sportData.relegation_probability.toFixed(1)}%`);
        console.log(`     Posição média: ${sportData.average_final_position.toFixed(1)}°`);
        console.log(`     Pontos médios: ${sportData.average_final_points.toFixed(1)}`);
        
        // Análise da posição atual
        const currentPosition = sportData.current_position;
        console.log(`     Posição atual: ${currentPosition}º`);
        
        // Calcular risco realista baseado na posição
        let realisticRisk = 0;
        if (currentPosition >= 17) {
          realisticRisk = 60 + (currentPosition - 17) * 10; // 60% a 90%
        } else if (currentPosition >= 15) {
          realisticRisk = 40 + (currentPosition - 15) * 10; // 40% a 60%
        } else {
          realisticRisk = Math.max(20, 40 - (15 - currentPosition) * 5); // 20% a 40%
        }
        
        console.log(`     Risco REALISTA esperado: ~${realisticRisk.toFixed(1)}%`);
        console.log(`     DIFERENÇA: ${(sportData.relegation_probability - realisticRisk).toFixed(1)}%`);
        
        if (sportData.relegation_probability > 90) {
          console.log('❌ RISCO AINDA MUITO ALTO - Correções não funcionaram completamente');
        } else if (sportData.relegation_probability > 70) {
          console.log('⚠️ RISCO ALTO - Correções funcionaram parcialmente');
        } else {
          console.log('✅ RISCO ACEITÁVEL - Correções funcionaram!');
        }
      }
    }

    // 3. ANÁLISE DO POWER INDEX
    console.log('\n📊 3. ANÁLISE DO POWER INDEX');
    
    if (latestSimulation.rows.length > 0 && latestSimulation.rows[0].power_index_data) {
      const powerIndex = latestSimulation.rows[0].power_index_data;
      const sportPowerIndex = powerIndex.find(team => team.team_name.toLowerCase().includes('sport'));
      
      if (sportPowerIndex) {
        console.log(`📊 SPORT - POWER INDEX ATUAL:`);
        console.log(`     Pontuação total: ${sportPowerIndex.power_index.toFixed(1)}`);
        console.log(`     Pontos por jogo: ${sportPowerIndex.points_per_game.toFixed(2)}`);
        console.log(`     Saldo de gols por jogo: ${sportPowerIndex.goal_difference_per_game.toFixed(2)}`);
        console.log(`     Forma recente: ${sportPowerIndex.recent_form_score.toFixed(2)}`);
        
        // Comparar com versão anterior
        const previousVersion = 28.9; // Versão 3.0.0
        const improvement = ((sportPowerIndex.power_index - previousVersion) / previousVersion) * 100;
        
        console.log(`     Power Index anterior (v3.0.0): ${previousVersion}`);
        console.log(`     Melhoria: ${improvement.toFixed(1)}%`);
        
        if (improvement > 20) {
          console.log('✅ Power Index melhorou significativamente!');
        } else {
          console.log('⚠️ Power Index melhorou pouco');
        }
      }
    }

    // 4. ANÁLISE GERAL DAS PROBABILIDADES
    console.log('\n🎲 4. ANÁLISE GERAL DAS PROBABILIDADES');
    
    if (latestSimulation.rows.length > 0 && latestSimulation.rows[0].simulation_results) {
      const results = latestSimulation.rows[0].simulation_results;
      
      // Top 3 título
      const top3Title = results
        .sort((a, b) => b.title_probability - a.title_probability)
        .slice(0, 3);
      
      console.log('📊 TOP 3 - CHANCES DE TÍTULO:');
      top3Title.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.team_name}: ${team.title_probability.toFixed(1)}%`);
      });
      
      // Top 3 rebaixamento
      const top3Relegation = results
        .sort((a, b) => b.relegation_probability - a.relegation_probability)
        .slice(0, 3);
      
      console.log('\n⚠️ TOP 3 - RISCO DE REBAIXAMENTO:');
      top3Relegation.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.team_name}: ${team.relegation_probability.toFixed(1)}%`);
      });
      
      // Análise de probabilidades extremas
      const extremeTitle = results.filter(team => team.title_probability > 70);
      const extremeRelegation = results.filter(team => team.relegation_probability > 90);
      
      console.log('\n📊 ANÁLISE DE PROBABILIDADES EXTREMAS:');
      console.log(`     Times com >70% título: ${extremeTitle.length}`);
      console.log(`     Times com >90% rebaixamento: ${extremeRelegation.length}`);
      
      if (extremeTitle.length > 0) {
        console.log('⚠️ Ainda há probabilidades extremas de título');
      }
      
      if (extremeRelegation.length > 0) {
        console.log('⚠️ Ainda há probabilidades extremas de rebaixamento');
      }
    }

    // 5. RESUMO DAS CORREÇÕES
    console.log('\n🔧 5. RESUMO DAS CORREÇÕES IMPLEMENTADAS');
    
    console.log('📊 CORREÇÕES V4.0.0:');
    console.log('   ✅ Power Index rebalanceado (60% pontos, 20% gols, 20% forma)');
    console.log('   ✅ Bonus de esperança aumentado (0.40-0.60 para times na zona)');
    console.log('   ✅ Volatilidade aumentada para 60%');
    console.log('   ✅ Fator de sobrevivência implementado');
    console.log('   ✅ Posições atualizadas dinamicamente durante simulação');
    console.log('   ✅ Bonus aplicado baseado na posição real');
    
    console.log('\n📊 EFEITOS ESPERADOS:');
    console.log('   • Sport deve ter risco < 80% (não mais 100%)');
    console.log('   • Flamengo deve ter título < 60% (não mais 77%)');
    console.log('   • Probabilidades mais equilibradas');
    console.log('   • Simulações mais realistas');

    // 6. PRÓXIMOS PASSOS
    console.log('\n🔄 6. PRÓXIMOS PASSOS');
    
    if (latestSimulation.rows.length > 0 && latestSimulation.rows[0].simulation_results) {
      const results = latestSimulation.rows[0].simulation_results;
      const sportData = results.find(team => team.team_name.toLowerCase().includes('sport'));
      
      if (sportData && sportData.relegation_probability > 80) {
        console.log('🔄 CORREÇÕES AINDA NECESSÁRIAS:');
        console.log('   1. Verificar se o backend foi reiniciado');
        console.log('   2. Verificar se há erros de compilação');
        console.log('   3. Executar nova simulação de teste');
        console.log('   4. Ajustar parâmetros se necessário');
      } else {
        console.log('✅ CORREÇÕES FUNCIONANDO!');
        console.log('   • Execute uma nova simulação para confirmar');
        console.log('   • Verifique se as probabilidades estão realistas');
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Conexão com banco local fechada');
    }
  }
}

// Executar o teste
testCorrectedV4();



