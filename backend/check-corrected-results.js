const { Client } = require('pg');

async function checkCorrectedResults() {
  console.log('🔍 VERIFICANDO RESULTADOS DAS SIMULAÇÕES CORRIGIDAS');
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

    // 1. VERIFICAR SIMULAÇÃO MAIS RECENTE (VERSÃO 3.0.0)
    console.log('\n🎯 1. VERIFICANDO SIMULAÇÃO MAIS RECENTE (VERSÃO 3.0.0)');
    
    const latestSimulation = await client.query(`
      SELECT 
        id,
        execution_date,
        simulation_count,
        algorithm_version,
        power_index_data,
        simulation_results
      FROM simulation_results 
      WHERE competition_id = 1 AND is_latest = true
      ORDER BY execution_date DESC
      LIMIT 1
    `);
    
    if (latestSimulation.rows.length === 0) {
      console.log('❌ Nenhuma simulação mais recente encontrada!');
      return;
    }
    
    const simulation = latestSimulation.rows[0];
    console.log(`📊 Simulação ID: ${simulation.id}`);
    console.log(`📅 Data: ${simulation.execution_date}`);
    console.log(`🎲 Simulações: ${simulation.simulation_count.toLocaleString()}`);
    console.log(`🔧 Versão: ${simulation.algorithm_version}`);

    // 2. ANALISAR POWER INDEX CORRIGIDO
    console.log('\n📊 2. ANALISANDO POWER INDEX CORRIGIDO');
    
    if (!simulation.power_index_data) {
      console.log('❌ Dados do Power Index não encontrados!');
      return;
    }
    
    const powerIndex = simulation.power_index_data;
    console.log(`📋 Total de times no Power Index: ${powerIndex.length}`);
    
    // Mostrar top 10 times com Power Index
    const topPowerIndex = powerIndex
      .sort((a, b) => b.power_index - a.power_index)
      .slice(0, 10);
    
    console.log('\n🏆 TOP 10 POWER INDEX (CORRIGIDO):');
    topPowerIndex.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.power_index.toFixed(1)}`);
    });

    // 3. ANALISAR RESULTADOS DA SIMULAÇÃO CORRIGIDA
    console.log('\n🎲 3. ANALISANDO RESULTADOS DA SIMULAÇÃO CORRIGIDA');
    
    if (!simulation.simulation_results) {
      console.log('❌ Resultados da simulação não encontrados!');
      return;
    }
    
    const results = simulation.simulation_results;
    console.log(`📋 Total de times nos resultados: ${results.length}`);
    
    // 4. ANALISAR PROBABILIDADES DE TÍTULO
    console.log('\n🏆 4. ANÁLISE DETALHADA - CHANCES DE TÍTULO');
    
    const titleChances = results
      .sort((a, b) => b.title_probability - a.title_probability)
      .slice(0, 10);
    
    console.log('📊 TOP 10 CHANCES DE TÍTULO (CORRIGIDAS):');
    titleChances.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.title_probability.toFixed(1)}%`);
    });

    // 5. ANALISAR RISCOS DE REBAIXAMENTO
    console.log('\n⚠️ 5. ANÁLISE DETALHADA - RISCOS DE REBAIXAMENTO');
    
    const relegationRisks = results
      .sort((a, b) => b.relegation_probability - a.relegation_probability)
      .slice(0, 10);
    
    console.log('📊 TOP 10 RISCOS DE REBAIXAMENTO (CORRIGIDOS):');
    relegationRisks.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.relegation_probability.toFixed(1)}%`);
    });

    // 6. VERIFICAR SE AS PROBABILIDADES FAZEM SENTIDO
    console.log('\n🔍 6. VERIFICANDO SE AS PROBABILIDADES FAZEM SENTIDO');
    
    const totalTitleProbability = results.reduce((sum, team) => sum + team.title_probability, 0);
    const totalRelegationProbability = results.reduce((sum, team) => sum + team.relegation_probability, 0);
    
    console.log(`📊 Soma total das probabilidades de título: ${totalTitleProbability.toFixed(1)}%`);
    console.log(`📊 Soma total dos riscos de rebaixamento: ${totalRelegationProbability.toFixed(1)}%`);
    
    if (Math.abs(totalTitleProbability - 100) > 1) {
      console.log(`❌ PROBLEMA: Soma das probabilidades de título deveria ser 100%, mas é ${totalTitleProbability.toFixed(1)}%`);
    } else {
      console.log(`✅ Soma das probabilidades de título está correta: ${totalTitleProbability.toFixed(1)}%`);
    }

    if (Math.abs(totalRelegationProbability - 100) > 1) {
      console.log(`❌ PROBLEMA: Soma dos riscos de rebaixamento deveria ser 100%, mas é ${totalRelegationProbability.toFixed(1)}%`);
    } else {
      console.log(`✅ Soma dos riscos de rebaixamento está correta: ${totalRelegationProbability.toFixed(1)}%`);
    }

    // 7. ANÁLISE ESPECÍFICA DO SPORT
    console.log('\n🎯 7. ANÁLISE ESPECÍFICA DO SPORT');
    
    const sportData = results.find(team => team.team_name.toLowerCase().includes('sport'));
    if (sportData) {
      console.log(`📊 SPORT (SIMULAÇÃO CORRIGIDA):`);
      console.log(`     Chance de título: ${sportData.title_probability.toFixed(1)}%`);
      console.log(`     Risco de rebaixamento: ${sportData.relegation_probability.toFixed(1)}%`);
      console.log(`     Posição média: ${sportData.average_final_position.toFixed(1)}°`);
      console.log(`     Pontos médios: ${sportData.average_final_points.toFixed(1)}`);
      
      // Verificar se está mais realista
      if (sportData.relegation_probability < 95) {
        console.log(`     ✅ MELHORIA: Risco de rebaixamento mais realista!`);
      } else {
        console.log(`     ❌ AINDA ALTO: Risco de rebaixamento ainda muito alto`);
      }
    }

    // 8. COMPARAÇÃO COM SIMULAÇÃO ANTERIOR
    console.log('\n📊 8. COMPARAÇÃO COM SIMULAÇÃO ANTERIOR');
    
    const previousSimulation = await client.query(`
      SELECT 
        algorithm_version,
        simulation_results
      FROM simulation_results 
      WHERE competition_id = 1 AND algorithm_version = '2.0.0'
      ORDER BY execution_date DESC
      LIMIT 1
    `);
    
    if (previousSimulation.rows.length > 0) {
      const previous = previousSimulation.rows[0];
      const previousResults = previous.simulation_results;
      
      if (previousResults) {
        const previousFlamengo = previousResults.find(team => team.team_name.toLowerCase().includes('flamengo'));
        const previousSport = previousResults.find(team => team.team_name.toLowerCase().includes('sport'));
        
        const currentFlamengo = results.find(team => team.team_name.toLowerCase().includes('flamengo'));
        const currentSport = results.find(team => team.team_name.toLowerCase().includes('sport'));
        
        console.log('📊 COMPARAÇÃO FLAMENGO:');
        if (previousFlamengo && currentFlamengo) {
          console.log(`     Versão 2.0.0: ${previousFlamengo.title_probability.toFixed(1)}%`);
          console.log(`     Versão 3.0.0: ${currentFlamengo.title_probability.toFixed(1)}%`);
          console.log(`     Diferença: ${(previousFlamengo.title_probability - currentFlamengo.title_probability).toFixed(1)}%`);
        }
        
        console.log('📊 COMPARAÇÃO SPORT:');
        if (previousSport && currentSport) {
          console.log(`     Versão 2.0.0: ${previousSport.relegation_probability.toFixed(1)}%`);
          console.log(`     Versão 3.0.0: ${currentSport.relegation_probability.toFixed(1)}%`);
          console.log(`     Diferença: ${(currentSport.relegation_probability - previousSport.relegation_probability).toFixed(1)}%`);
        }
      }
    }

    // 9. AVALIAÇÃO FINAL DAS CORREÇÕES
    console.log('\n💡 9. AVALIAÇÃO FINAL DAS CORREÇÕES');
    
    let improvements = 0;
    let totalChecks = 0;
    
    // Verificar probabilidades de título
    if (titleChances[0]?.title_probability < 80) {
      console.log('✅ Probabilidades de título mais realistas');
      improvements++;
    } else {
      console.log('❌ Probabilidades de título ainda muito altas');
    }
    totalChecks++;
    
    // Verificar riscos de rebaixamento
    if (relegationRisks[0]?.relegation_probability < 95) {
      console.log('✅ Riscos de rebaixamento mais realistas');
      improvements++;
    } else {
      console.log('❌ Riscos de rebaixamento ainda muito altos');
    }
    totalChecks++;
    
    // Verificar soma das probabilidades
    if (Math.abs(totalTitleProbability - 100) <= 1) {
      console.log('✅ Soma das probabilidades de título correta');
      improvements++;
    } else {
      console.log('❌ Soma das probabilidades de título incorreta');
    }
    totalChecks++;
    
    if (Math.abs(totalRelegationProbability - 100) <= 1) {
      console.log('✅ Soma dos riscos de rebaixamento correta');
      improvements++;
    } else {
      console.log('❌ Soma dos riscos de rebaixamento incorreta');
    }
    totalChecks++;
    
    console.log(`\n📊 RESULTADO FINAL: ${improvements}/${totalChecks} correções funcionando`);
    
    if (improvements === totalChecks) {
      console.log('🎉 TODAS AS CORREÇÕES FUNCIONANDO PERFEITAMENTE!');
    } else if (improvements >= totalChecks * 0.75) {
      console.log('✅ MAIORIA DAS CORREÇÕES FUNCIONANDO!');
    } else {
      console.log('⚠️ ALGUMAS CORREÇÕES AINDA PRECISAM DE AJUSTES');
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Conexão com banco local fechada');
    }
  }
}

// Executar a verificação
checkCorrectedResults();
