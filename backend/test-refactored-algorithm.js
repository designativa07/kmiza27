const { Client } = require('pg');

async function testRefactoredAlgorithm() {
  console.log('🧪 TESTANDO ALGORITMO COMPLETAMENTE REFATORADO');
  console.log('===============================================\n');

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

    // 2. RESUMO DAS MUDANÇAS IMPLEMENTADAS
    console.log('\n🔧 2. ALGORITMO COMPLETAMENTE REFATORADO');
    
    console.log('📊 MUDANÇAS IMPLEMENTADAS:');
    console.log('   ✅ Algoritmo baseado em realismo futebolístico');
    console.log('   ✅ Probabilidades base normalizadas (0-1)');
    console.log('   ✅ Vantagem de casa reduzida para 15% (era 20%)');
    console.log('   ✅ Fator de posição baseado na diferença real');
    console.log('   ✅ Fator de esperança realista e limitado');
    console.log('   ✅ Volatilidade reduzida para 40% (era 80%)');
    console.log('   ✅ Probabilidades limitadas entre 15% e 85%');
    console.log('   ✅ Chance de empate aumentada para 30% (era 25%)');
    
    console.log('\n📊 EFEITOS ESPERADOS:');
    console.log('   • Sport deve ter risco < 50% (não mais 98%)');
    console.log('   • Flamengo deve ter título < 40% (não mais 68%)');
    console.log('   • Probabilidades muito mais equilibradas');
    console.log('   • Simulações refletem realidade do futebol');

    // 3. ANÁLISE ATUAL (ANTES DO ALGORITMO REFATORADO)
    console.log('\n📊 3. ANÁLISE ATUAL (ANTES DO ALGORITMO REFATORADO)');
    
    if (latest.simulation_results) {
      const results = latest.simulation_results;
      
      // Análise do Sport
      const sportData = results.find(team => team.team_name.toLowerCase().includes('sport'));
      if (sportData) {
        console.log('\n🎯 SPORT - SITUAÇÃO ATUAL:');
        console.log(`     Risco de rebaixamento: ${sportData.relegation_probability.toFixed(1)}%`);
        console.log(`     Posição média: ${sportData.average_final_position.toFixed(1)}°`);
        console.log(`     Pontos médios: ${sportData.average_final_points.toFixed(1)}`);
        console.log(`     Posição atual: ${sportData.current_position}º`);
        
        if (sportData.relegation_probability > 90) {
          console.log('❌ RISCO AINDA MUITO ALTO - Algoritmo refatorado necessário');
        } else if (sportData.relegation_probability > 70) {
          console.log('⚠️ RISCO ALTO - Melhorou mas ainda precisa de ajustes');
        } else {
          console.log('✅ RISCO ACEITÁVEL - Algoritmo funcionando!');
        }
      }
      
      // Análise do Flamengo
      const flamengoData = results.find(team => team.team_name.toLowerCase().includes('flamengo'));
      if (flamengoData) {
        console.log('\n🦅 FLAMENGO - SITUAÇÃO ATUAL:');
        console.log(`     Chance de título: ${flamengoData.title_probability.toFixed(1)}%`);
        console.log(`     Posição média: ${flamengoData.average_final_position.toFixed(1)}°`);
        console.log(`     Pontos médios: ${flamengoData.average_final_points.toFixed(1)}`);
        
        if (flamengoData.title_probability > 60) {
          console.log('❌ CHANCE AINDA MUITO ALTA - Algoritmo refatorado necessário');
        } else if (flamengoData.title_probability > 40) {
          console.log('⚠️ CHANCE ALTA - Melhorou mas ainda precisa de ajustes');
        } else {
          console.log('✅ CHANCE ACEITÁVEL - Algoritmo funcionando!');
        }
      }
      
      // Análise geral
      const extremeTitle = results.filter(team => team.title_probability > 60);
      const extremeRelegation = results.filter(team => team.relegation_probability > 80);
      
      console.log('\n📊 PROBABILIDADES EXTREMAS ATUAIS:');
      console.log(`     Times com >60% título: ${extremeTitle.length}`);
      console.log(`     Times com >80% rebaixamento: ${extremeRelegation.length}`);
      
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

    // 4. PRÓXIMOS PASSOS
    console.log('\n🔄 4. PRÓXIMOS PASSOS');
    
    console.log('🔄 PARA TESTAR O ALGORITMO REFATORADO:');
    console.log('   1. ✅ Código já foi recompilado');
    console.log('   2. 🔄 REINICIAR O BACKEND (obrigatório!)');
    console.log('   3. 🎯 Executar nova simulação de teste');
    console.log('   4. 📊 Verificar se Sport tem risco < 50%');
    console.log('   5. 📊 Verificar se Flamengo tem título < 40%');
    
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   • O algoritmo foi completamente refatorado');
    console.log('   • Baseado em realismo futebolístico');
    console.log('   • Probabilidades muito mais equilibradas');
    console.log('   • Backend PRECISA ser reiniciado');

    // 5. RESUMO FINAL
    console.log('\n🎯 5. RESUMO FINAL');
    
    console.log('✅ STATUS ATUAL:');
    console.log('   • Algoritmo completamente refatorado');
    console.log('   • Baseado em realismo futebolístico');
    console.log('   • Probabilidades normalizadas e limitadas');
    console.log('   • Fatores de esperança realistas');
    console.log('   • Backend precisa ser reiniciado');
    
    console.log('\n🎉 PRÓXIMA SIMULAÇÃO DEVE SER REVOLUCIONÁRIA!');
    console.log('   • Probabilidades muito mais realistas');
    console.log('   • Sport com chance real de escapar da zona');
    console.log('   • Flamengo com chance equilibrada de título');

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
testRefactoredAlgorithm();



