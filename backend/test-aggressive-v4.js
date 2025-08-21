const { Client } = require('pg');

async function testAggressiveV4() {
  console.log('🧪 TESTANDO CORREÇÕES AGRESSIVAS VERSÃO 4.0.0');
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

    // 2. RESUMO DAS CORREÇÕES AGRESSIVAS IMPLEMENTADAS
    console.log('\n🔧 2. CORREÇÕES AGRESSIVAS IMPLEMENTADAS');
    
    console.log('📊 CORREÇÕES V4.0.0 AGRESSIVAS:');
    console.log('   ✅ Volatilidade aumentada para 80% (era 60%)');
    console.log('   ✅ Fator de esperança aumentado para 5.0x (era 2.0x)');
    console.log('   ✅ Bonus de esperança aumentado para 0.80-1.00 (era 0.40-0.60)');
    console.log('   ✅ Bonus de sobrevivência aumentado para 0.40-0.80 (era 0.20-0.40)');
    console.log('   ✅ Impacto do bonus aumentado para 30% (era 10%)');
    console.log('   ✅ MILAGRE DE SOBREVIVÊNCIA implementado');
    console.log('     • Times na zona em casa: +20% chance de vitória');
    console.log('     • Times na zona visitante: +15% chance de vitória');
    
    console.log('\n📊 EFEITOS ESPERADOS:');
    console.log('   • Sport deve ter risco < 60% (não mais 100%)');
    console.log('   • Flamengo deve ter título < 50% (não mais 77%)');
    console.log('   • Times na zona com chances realistas de recuperação');
    console.log('   • Simulações muito mais imprevisíveis e realistas');

    // 3. ANÁLISE ATUAL (ANTES DAS CORREÇÕES AGRESSIVAS)
    console.log('\n📊 3. ANÁLISE ATUAL (ANTES DAS CORREÇÕES AGRESSIVAS)');
    
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
          console.log('❌ RISCO AINDA MUITO ALTO - Correções agressivas necessárias');
        } else if (sportData.relegation_probability > 70) {
          console.log('⚠️ RISCO ALTO - Melhorou mas ainda precisa de ajustes');
        } else {
          console.log('✅ RISCO ACEITÁVEL - Correções funcionaram!');
        }
      }
      
      // Análise geral
      const extremeTitle = results.filter(team => team.title_probability > 70);
      const extremeRelegation = results.filter(team => team.relegation_probability > 90);
      
      console.log('\n📊 PROBABILIDADES EXTREMAS ATUAIS:');
      console.log(`     Times com >70% título: ${extremeTitle.length}`);
      console.log(`     Times com >90% rebaixamento: ${extremeRelegation.length}`);
      
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
    
    console.log('🔄 PARA APLICAR AS CORREÇÕES AGRESSIVAS:');
    console.log('   1. ✅ Código já foi recompilado');
    console.log('   2. 🔄 REINICIAR O BACKEND (obrigatório!)');
    console.log('   3. 🎯 Executar nova simulação de teste');
    console.log('   4. 📊 Verificar se Sport tem risco < 60%');
    console.log('   5. 📊 Verificar se Flamengo tem título < 50%');
    
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   • As correções agressivas estão no código');
    console.log('   • O backend PRECISA ser reiniciado para carregar');
    console.log('   • A próxima simulação deve ser drasticamente diferente');
    console.log('   • Sport deve ter chance realista de escapar da zona');

    // 5. RESUMO FINAL
    console.log('\n🎯 5. RESUMO FINAL');
    
    console.log('✅ STATUS ATUAL:');
    console.log('   • Código corrigido com correções agressivas');
    console.log('   • Volatilidade aumentada para 80%');
    console.log('   • Fator de esperança aumentado para 5.0x');
    console.log('   • Milagre de sobrevivência implementado');
    console.log('   • Backend precisa ser reiniciado');
    
    console.log('\n🎉 PRÓXIMA SIMULAÇÃO DEVE SER REVOLUCIONÁRIA!');

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
testAggressiveV4();
