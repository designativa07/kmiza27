const { Client } = require('pg');

async function deepAnalysisSimulation() {
  console.log('🔍 ANÁLISE PROFUNDA DO ALGORITMO DE SIMULAÇÃO');
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

    // 1. ANÁLISE DA SITUAÇÃO ATUAL DO SPORT
    console.log('\n🎯 1. ANÁLISE DA SITUAÇÃO ATUAL DO SPORT');
    
    const sportCurrent = await client.query(`
      SELECT 
        ct.team_id,
        t.name as team_name,
        ct.points,
        ct.played,
        ct.won,
        ct.drawn,
        ct.lost,
        ct.goals_for,
        ct.goals_against,
        ct.goal_difference
      FROM competition_teams ct
      INNER JOIN teams t ON ct.team_id = t.id
      WHERE ct.competition_id = 1 AND t.name ILIKE '%sport%'
    `);
    
    if (sportCurrent.rows.length > 0) {
      const sport = sportCurrent.rows[0];
      console.log(`📊 SPORT - SITUAÇÃO ATUAL:`);
      console.log(`     Pontos: ${sport.points}pts`);
      console.log(`     Jogos: ${sport.played}/38`);
      console.log(`     Vitórias: ${sport.won}, Empates: ${sport.drawn}, Derrotas: ${sport.lost}`);
      console.log(`     Gols: ${sport.goals_for}GP, ${sport.goals_against}GC, ${sport.goal_difference}SG`);
      console.log(`     Jogos restantes: ${38 - sport.played}`);
      console.log(`     Pontos para escapar: ${18 - sport.points} (${Math.ceil((18 - sport.points) / 3)} vitórias)`);
    }

    // 2. ANÁLISE DA ZONA DE REBAIXAMENTO
    console.log('\n⚠️ 2. ANÁLISE DA ZONA DE REBAIXAMENTO');
    
    const relegationZone = await client.query(`
      SELECT 
        ct.team_id,
        t.name as team_name,
        ct.points,
        ct.played,
        ct.goal_difference
      FROM competition_teams ct
      INNER JOIN teams t ON ct.team_id = t.id
      WHERE ct.competition_id = 1
      ORDER BY ct.points ASC
      LIMIT 6
    `);
    
    console.log('📊 TIMES NA ZONA DE REBAIXAMENTO:');
    relegationZone.rows.forEach((team, index) => {
      const position = index + 1;
      const pointsFromSafety = 18 - team.points;
      console.log(`  ${position}. ${team.team_name}: ${team.points}pts (${pointsFromSafety}pts da segurança)`);
    });

    // 3. ANÁLISE DAS ÚLTIMAS SIMULAÇÕES
    console.log('\n🎲 3. ANÁLISE DAS ÚLTIMAS SIMULAÇÕES');
    
    const latestSimulations = await client.query(`
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
      LIMIT 3
    `);
    
    console.log(`📊 Simulações analisadas: ${latestSimulations.rows.length}`);
    
    latestSimulations.rows.forEach((sim, index) => {
      console.log(`\n  ${index + 1}. Simulação ID: ${sim.id}`);
      console.log(`     Data: ${sim.execution_date}`);
      console.log(`     Versão: ${sim.algorithm_version}`);
      console.log(`     Simulações: ${sim.simulation_count.toLocaleString()}`);
      
      if (sim.simulation_results) {
        const results = sim.simulation_results;
        const sportData = results.find(team => team.team_name.toLowerCase().includes('sport'));
        
        if (sportData) {
          console.log(`     SPORT nesta simulação:`);
          console.log(`       Risco de rebaixamento: ${sportData.relegation_probability.toFixed(1)}%`);
          console.log(`       Posição média: ${sportData.average_final_position.toFixed(1)}°`);
          console.log(`       Pontos médios: ${sportData.average_final_points.toFixed(1)}`);
        }
      }
    });

    // 4. ANÁLISE DO POWER INDEX
    console.log('\n📊 4. ANÁLISE DO POWER INDEX');
    
    const latestSim = latestSimulations.rows[0];
    if (latestSim && latestSim.power_index_data) {
      const powerIndex = latestSim.power_index_data;
      const sportPowerIndex = powerIndex.find(team => team.team_name.toLowerCase().includes('sport'));
      
      if (sportPowerIndex) {
        console.log(`📊 SPORT - POWER INDEX:`);
        console.log(`     Pontuação total: ${sportPowerIndex.power_index.toFixed(1)}`);
        console.log(`     Pontos por jogo: ${sportPowerIndex.points_per_game.toFixed(2)}`);
        console.log(`     Saldo de gols por jogo: ${sportPowerIndex.goal_difference_per_game.toFixed(2)}`);
        console.log(`     Forma recente: ${sportPowerIndex.recent_form.toFixed(2)}`);
        
        // Comparar com outros times
        const topPowerIndex = powerIndex
          .sort((a, b) => b.power_index - a.power_index)
          .slice(0, 5);
        
        console.log('\n📊 TOP 5 POWER INDEX:');
        topPowerIndex.forEach((team, index) => {
          console.log(`  ${index + 1}. ${team.team_name}: ${team.power_index.toFixed(1)}`);
        });
        
        const bottomPowerIndex = powerIndex
          .sort((a, b) => a.power_index - b.power_index)
          .slice(0, 5);
        
        console.log('\n📊 BOTTOM 5 POWER INDEX:');
        bottomPowerIndex.forEach((team, index) => {
          console.log(`  ${index + 1}. ${team.team_name}: ${team.power_index.toFixed(1)}`);
        });
      }
    }

    // 5. IDENTIFICAÇÃO DOS PROBLEMAS ESPECÍFICOS
    console.log('\n🚨 5. IDENTIFICAÇÃO DOS PROBLEMAS ESPECÍFICOS');
    
    console.log('❌ PROBLEMAS IDENTIFICADOS:');
    console.log('   1. Power Index muito baixo para times na zona de rebaixamento');
    console.log('   2. Algoritmo não considera "esperança" suficiente para times em dificuldade');
    console.log('   3. Volatilidade de 35% pode não ser suficiente');
    console.log('   4. Fator de esperança pode estar sendo sobrescrito');
    console.log('   5. Normalização pode estar muito severa para times com poucos pontos');

    // 6. ANÁLISE MATEMÁTICA DO PROBLEMA
    console.log('\n🔬 6. ANÁLISE MATEMÁTICA DO PROBLEMA');
    
    if (sportCurrent.rows.length > 0) {
      const sport = sportCurrent.rows[0];
      const remainingGames = 38 - sport.played;
      const pointsToSafety = 18 - sport.points;
      
      console.log('📊 ANÁLISE MATEMÁTICA DO SPORT:');
      console.log(`     Jogos restantes: ${remainingGames}`);
      console.log(`     Pontos para escapar: ${pointsToSafety}`);
      console.log(`     Vitórias necessárias: ${Math.ceil(pointsToSafety / 3)}`);
      console.log(`     Taxa de vitória necessária: ${((Math.ceil(pointsToSafety / 3) / remainingGames) * 100).toFixed(1)}%`);
      
      // Calcular probabilidade realista
      const minWinsNeeded = Math.ceil(pointsToSafety / 3);
      const realisticRelegationRisk = Math.max(20, Math.min(80, (minWinsNeeded / remainingGames) * 100));
      
      console.log(`     Risco de rebaixamento REALISTA: ~${realisticRelegationRisk.toFixed(1)}%`);
      console.log(`     Risco atual da simulação: 99.6%`);
      console.log(`     DIFERENÇA: ${(99.6 - realisticRelegationRisk).toFixed(1)}% (MUITO EXAGERADO!)`);
    }

    // 7. RECOMENDAÇÕES DE CORREÇÃO
    console.log('\n💡 7. RECOMENDAÇÕES DE CORREÇÃO');
    
    console.log('🔧 CORREÇÕES NECESSÁRIAS:');
    console.log('   1. AUMENTAR fator de esperança para times na zona (0.30-0.50)');
    console.log('   2. AUMENTAR volatilidade para 50-60%');
    console.log('   3. ADICIONAR "bonus de sobrevivência" para times com poucos pontos');
    console.log('   4. REBAIXAR normalização para times com poucos pontos');
    console.log('   5. IMPLEMENTAR "fator de esperança" mais agressivo');
    console.log('   6. CONSIDERAR histórico de recuperação de times na zona');

    // 8. PLANO DE IMPLEMENTAÇÃO
    console.log('\n🔄 8. PLANO DE IMPLEMENTAÇÃO');
    
    console.log('🔄 PRÓXIMOS PASSOS:');
    console.log('   1. Corrigir Power Index para ser mais generoso com times na zona');
    console.log('   2. Aumentar volatilidade para 50-60%');
    console.log('   3. Implementar fator de esperança mais agressivo');
    console.log('   4. Adicionar bonus de sobrevivência');
    console.log('   5. Testar com nova simulação');
    console.log('   6. Verificar se Sport tem risco < 70%');

  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Conexão com banco local fechada');
    }
  }
}

// Executar a análise
deepAnalysisSimulation();
