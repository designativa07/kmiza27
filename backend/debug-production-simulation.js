const { DataSource } = require('typeorm');

async function debugProductionSimulation() {
  console.log('🔍 DIAGNÓSTICO DA SIMULAÇÃO EM PRODUÇÃO (VPS)');
  console.log('================================================\n');

  // Configuração para PRODUÇÃO (VPS)
  const dataSource = new DataSource({
    type: 'postgres',
    host: '195.200.0.191',
    port: 5433,
    username: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
    entities: [],
    synchronize: false,
    logging: false,
    ssl: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados de PRODUÇÃO (VPS)');

    // 1. VERIFICAR CLASSIFICAÇÃO ATUAL DO BRASILEIRÃO
    console.log('\n🏆 1. VERIFICANDO CLASSIFICAÇÃO ATUAL DO BRASILEIRÃO');
    
    const currentStandings = await dataSource.query(`
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
      WHERE ct.competition_id = 1
      ORDER BY ct.points DESC, ct.goal_difference DESC
      LIMIT 10
    `);
    
    console.log('📊 TOP 10 CLASSIFICAÇÃO ATUAL:');
    currentStandings.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.points}pts (${team.played}J, ${team.won}V, ${team.drawn}E, ${team.lost}D, ${team.goals_for}GP, ${team.goals_against}GC, ${team.goal_difference}SG)`);
    });

    // 2. VERIFICAR JOGOS RESTANTES
    console.log('\n⚽ 2. VERIFICANDO JOGOS RESTANTES');
    
    const remainingMatches = await dataSource.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN m.round_id IS NOT NULL THEN 1 END) as with_rounds,
        COUNT(CASE WHEN m.round_id IS NULL THEN 1 END) as without_rounds
      FROM matches m
      WHERE m.competition_id = 1 
        AND m.status = 'scheduled'
    `);
    
    console.log(`📊 Total de jogos restantes: ${remainingMatches[0].total_matches}`);
    console.log(`📋 Com rodadas definidas: ${remainingMatches[0].with_rounds}`);
    console.log(`📋 Sem rodadas definidas: ${remainingMatches[0].without_rounds}`);

    // 3. VERIFICAR ÚLTIMAS SIMULAÇÕES
    console.log('\n🎲 3. VERIFICANDO ÚLTIMAS SIMULAÇÕES');
    
    const simulations = await dataSource.query(`
      SELECT 
        id,
        execution_date,
        simulation_count,
        execution_duration_ms,
        algorithm_version,
        is_latest,
        metadata
      FROM simulation_results 
      WHERE competition_id = 1
      ORDER BY execution_date DESC
      LIMIT 5
    `);
    
    console.log(`📊 Total de simulações encontradas: ${simulations.length}`);
    simulations.forEach((sim, index) => {
      console.log(`\n  ${index + 1}. Simulação ID: ${sim.id}`);
      console.log(`     Data: ${sim.execution_date}`);
      console.log(`     Simulações: ${sim.simulation_count.toLocaleString()}`);
      console.log(`     Duração: ${sim.execution_duration_ms}ms`);
      console.log(`     Versão: ${sim.algorithm_version}`);
      console.log(`     É a mais recente: ${sim.is_latest ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`     Metadados: ${sim.metadata ? 'Presentes' : 'Ausentes'}`);
    });

    // 4. ANALISAR SIMULAÇÃO MAIS RECENTE
    const latestSimulation = simulations.find(s => s.is_latest);
    if (!latestSimulation) {
      console.log('\n❌ Nenhuma simulação marcada como mais recente!');
      return;
    }

    console.log(`\n🎯 4. ANALISANDO SIMULAÇÃO MAIS RECENTE (ID: ${latestSimulation.id})`);

    // 5. VERIFICAR DADOS DO POWER INDEX
    console.log('\n📊 5. VERIFICANDO DADOS DO POWER INDEX');
    
    const powerIndexData = await dataSource.query(`
      SELECT 
        power_index_data
      FROM simulation_results 
      WHERE id = $1
    `, [latestSimulation.id]);
    
    if (powerIndexData.length === 0 || !powerIndexData[0].power_index_data) {
      console.log('❌ Dados do Power Index não encontrados!');
      return;
    }
    
    const powerIndex = powerIndexData[0].power_index_data;
    console.log(`📋 Total de times no Power Index: ${powerIndex.length}`);
    
    // Mostrar top 10 times com Power Index
    const topPowerIndex = powerIndex
      .sort((a, b) => b.power_index - a.power_index)
      .slice(0, 10);
    
    console.log('\n🏆 TOP 10 POWER INDEX:');
    topPowerIndex.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.power_index.toFixed(1)}`);
    });

    // 6. VERIFICAR RESULTADOS DA SIMULAÇÃO
    console.log('\n🎲 6. VERIFICANDO RESULTADOS DA SIMULAÇÃO');
    
    const simulationResults = await dataSource.query(`
      SELECT 
        simulation_results
      FROM simulation_results 
      WHERE id = $1
    `, [latestSimulation.id]);
    
    if (simulationResults.length === 0 || !simulationResults[0].simulation_results) {
      console.log('❌ Resultados da simulação não encontrados!');
      return;
    }
    
    const results = simulationResults[0].simulation_results;
    console.log(`📋 Total de times nos resultados: ${results.length}`);
    
    // 7. ANALISAR PROBABILIDADES DE TÍTULO
    console.log('\n🏆 7. ANÁLISE DETALHADA - CHANCES DE TÍTULO');
    
    const titleChances = results
      .sort((a, b) => b.title_probability - a.title_probability)
      .slice(0, 10);
    
    console.log('📊 TOP 10 CHANCES DE TÍTULO:');
    titleChances.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.title_probability.toFixed(1)}%`);
    });

    // 8. VERIFICAR SE AS PROBABILIDADES FAZEM SENTIDO
    console.log('\n🔍 8. VERIFICANDO SE AS PROBABILIDADES FAZEM SENTIDO');
    
    const totalProbability = results.reduce((sum, team) => sum + team.title_probability, 0);
    console.log(`📊 Soma total das probabilidades: ${totalProbability.toFixed(1)}%`);
    
    if (Math.abs(totalProbability - 100) > 1) {
      console.log(`❌ PROBLEMA: Soma das probabilidades deveria ser 100%, mas é ${totalProbability.toFixed(1)}%`);
    } else {
      console.log(`✅ Soma das probabilidades está correta: ${totalProbability.toFixed(1)}%`);
    }

    // 9. COMPARAR COM CLASSIFICAÇÃO ATUAL
    console.log('\n📊 9. COMPARAÇÃO COM CLASSIFICAÇÃO ATUAL');
    
    const top3Current = currentStandings.slice(0, 3);
    const top3Simulation = titleChances.slice(0, 3);
    
    console.log('🏆 TOP 3 - CLASSIFICAÇÃO ATUAL vs SIMULAÇÃO:');
    for (let i = 0; i < 3; i++) {
      const current = top3Current[i];
      const simulation = top3Simulation[i];
      
      if (current && simulation) {
        const currentTeam = current.team_name;
        const simulationTeam = simulation.team_name;
        const points = current.points;
        const probability = simulation.title_probability;
        
        console.log(`  ${i + 1}. Atual: ${currentTeam} (${points}pts) | Simulação: ${simulationTeam} (${probability.toFixed(1)}%)`);
        
        if (currentTeam !== simulationTeam) {
          console.log(`     ⚠️ DIFERENÇA: Time diferente na posição ${i + 1}`);
        }
      }
    }

    // 10. VERIFICAR METADADOS DA SIMULAÇÃO
    console.log('\n🔧 10. VERIFICANDO METADADOS DA SIMULAÇÃO');
    
    if (latestSimulation.metadata) {
      console.log('📋 Metadados encontrados:');
      console.log(`     Duração: ${latestSimulation.metadata.execution_duration_ms}ms`);
      console.log(`     Versão: ${latestSimulation.metadata.algorithm_version}`);
      console.log(`     Pesos: ${JSON.stringify(latestSimulation.metadata.power_index_weights)}`);
    } else {
      console.log('❌ Metadados não encontrados!');
    }

    // 11. VERIFICAR SE HÁ PROBLEMAS NOS DADOS
    console.log('\n⚠️ 11. VERIFICANDO PROBLEMAS NOS DADOS');
    
    // Verificar se há times com probabilidades extremas
    const extremeProbabilities = results.filter(team => 
      team.title_probability > 90 || team.title_probability < 0.1
    );
    
    if (extremeProbabilities.length > 0) {
      console.log(`🚨 TIMES COM PROBABILIDADES EXTREMAS: ${extremeProbabilities.length}`);
      extremeProbabilities.forEach(team => {
        console.log(`     - ${team.team_name}: ${team.title_probability.toFixed(1)}%`);
      });
    } else {
      console.log('✅ Nenhuma probabilidade extrema encontrada');
    }

    // 12. RECOMENDAÇÕES
    console.log('\n💡 12. RECOMENDAÇÕES');
    
    if (totalProbability !== 100) {
      console.log('🔴 PRIORIDADE ALTA: Corrigir algoritmo de simulação');
    }
    
    if (extremeProbabilities.length > 0) {
      console.log('🟡 PRIORIDADE MÉDIA: Investigar por que há probabilidades extremas');
    }
    
    if (latestSimulation.execution_duration_ms < 1000) {
      console.log('🟡 PRIORIDADE MÉDIA: Verificar se simulação está sendo executada corretamente');
    }

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Conexão com banco de produção fechada');
    }
  }
}

// Executar o diagnóstico
debugProductionSimulation();
