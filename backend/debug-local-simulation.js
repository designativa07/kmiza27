const { Client } = require('pg');

async function debugLocalSimulation() {
  console.log('🔍 DIAGNÓSTICO DA SIMULAÇÃO MONTE CARLO - BASE LOCAL');
  console.log('=====================================================\n');

  // Configuração para BASE LOCAL - usando kmiza27_dev
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

    // 1. VERIFICAR CLASSIFICAÇÃO ATUAL DO BRASILEIRÃO
    console.log('\n🏆 1. VERIFICANDO CLASSIFICAÇÃO ATUAL DO BRASILEIRÃO');
    
    const currentStandings = await client.query(`
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
      LIMIT 20
    `);
    
    console.log('📊 CLASSIFICAÇÃO ATUAL (TOP 20):');
    currentStandings.rows.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.points}pts (${team.played}J, ${team.won}V, ${team.drawn}E, ${team.lost}D, ${team.goals_for}GP, ${team.goals_against}GC, ${team.goal_difference}SG)`);
    });

    // 2. VERIFICAR JOGOS RESTANTES
    console.log('\n⚽ 2. VERIFICANDO JOGOS RESTANTES');
    
    const remainingMatches = await client.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduled,
        COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finished
      FROM matches m
      WHERE m.competition_id = 1
    `);
    
    console.log(`📊 Total de jogos: ${remainingMatches.rows[0].total_matches}`);
    console.log(`📋 Jogos finalizados: ${remainingMatches.rows[0].finished}`);
    console.log(`📋 Jogos agendados: ${remainingMatches.rows[0].scheduled}`);
    console.log(`📋 Jogos restantes: ${remainingMatches.rows[0].scheduled}`);

    // 3. VERIFICAR SIMULAÇÕES
    console.log('\n🎲 3. VERIFICANDO SIMULAÇÕES');
    
    const simulations = await client.query(`
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
    
    console.log(`📊 Total de simulações encontradas: ${simulations.rows.length}`);
    simulations.rows.forEach((sim, index) => {
      console.log(`\n  ${index + 1}. Simulação ID: ${sim.id}`);
      console.log(`     Data: ${sim.execution_date}`);
      console.log(`     Simulações: ${sim.simulation_count.toLocaleString()}`);
      console.log(`     Duração: ${sim.execution_duration_ms}ms`);
      console.log(`     Versão: ${sim.algorithm_version}`);
      console.log(`     É a mais recente: ${sim.is_latest ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`     Metadados: ${sim.metadata ? 'Presentes' : 'Ausentes'}`);
    });

    // 4. ANALISAR SIMULAÇÃO MAIS RECENTE
    const latestSimulation = simulations.rows.find(s => s.is_latest);
    if (!latestSimulation) {
      console.log('\n❌ Nenhuma simulação marcada como mais recente!');
      return;
    }

    console.log(`\n🎯 4. ANALISANDO SIMULAÇÃO MAIS RECENTE (ID: ${latestSimulation.id})`);

    // 5. VERIFICAR DADOS DO POWER INDEX
    console.log('\n📊 5. VERIFICANDO DADOS DO POWER INDEX');
    
    const powerIndexData = await client.query(`
      SELECT 
        power_index_data
      FROM simulation_results 
      WHERE id = $1
    `, [latestSimulation.id]);
    
    if (powerIndexData.rows.length === 0 || !powerIndexData.rows[0].power_index_data) {
      console.log('❌ Dados do Power Index não encontrados!');
      return;
    }
    
    const powerIndex = powerIndexData.rows[0].power_index_data;
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
    
    const simulationResults = await client.query(`
      SELECT 
        simulation_results
      FROM simulation_results 
      WHERE id = $1
    `, [latestSimulation.id]);
    
    if (simulationResults.rows.length === 0 || !simulationResults.rows[0].simulation_results) {
      console.log('❌ Resultados da simulação não encontrados!');
      return;
    }
    
    const results = simulationResults.rows[0].simulation_results;
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

    // 8. ANALISAR RISCOS DE REBAIXAMENTO
    console.log('\n⚠️ 8. ANÁLISE DETALHADA - RISCOS DE REBAIXAMENTO');
    
    const relegationRisks = results
      .sort((a, b) => b.relegation_probability - a.relegation_probability)
      .slice(0, 10);
    
    console.log('📊 TOP 10 RISCOS DE REBAIXAMENTO:');
    relegationRisks.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.relegation_probability.toFixed(1)}%`);
    });

    // 9. VERIFICAR SE AS PROBABILIDADES FAZEM SENTIDO
    console.log('\n🔍 9. VERIFICANDO SE AS PROBABILIDADES FAZEM SENTIDO');
    
    const totalTitleProbability = results.reduce((sum, team) => sum + team.title_probability, 0);
    const totalRelegationProbability = results.reduce((sum, team) => sum + team.relegation_probability, 0);
    
    console.log(`📊 Soma total das probabilidades de título: ${totalTitleProbability.toFixed(1)}%`);
    console.log(`📊 Soma total dos riscos de rebaixamento: ${totalRelegationProbability.toFixed(1)}%`);
    
    if (Math.abs(totalTitleProbability - 100) > 1) {
      console.log(`❌ PROBLEMA: Soma das probabilidades de título deveria ser 100%, mas é ${totalTitleProbability.toFixed(1)}%`);
    } else {
      console.log(`✅ Soma das probabilidades de título está correta: ${totalTitleProbability.toFixed(1)}%`);
    }

    // 10. ANÁLISE ESPECÍFICA DO SPORT
    console.log('\n🎯 10. ANÁLISE ESPECÍFICA DO SPORT');
    
    const sportData = results.find(team => team.team_name.toLowerCase().includes('sport'));
    if (sportData) {
      console.log(`📊 SPORT:`);
      console.log(`     Chance de título: ${sportData.title_probability.toFixed(1)}%`);
      console.log(`     Risco de rebaixamento: ${sportData.relegation_probability.toFixed(1)}%`);
      console.log(`     Posição média: ${sportData.average_final_position.toFixed(1)}°`);
      console.log(`     Pontos médios: ${sportData.average_final_points.toFixed(1)}`);
      
      // Verificar posição atual do Sport
      const sportCurrent = currentStandings.rows.find(team => 
        team.team_name.toLowerCase().includes('sport')
      );
      
      if (sportCurrent) {
        console.log(`     Posição atual: ${sportCurrent.points}pts em ${sportCurrent.played} jogos`);
        console.log(`     Distância da zona de rebaixamento: ${sportCurrent.points - 18} pontos`);
      }
    }

    // 11. RECOMENDAÇÕES
    console.log('\n💡 11. RECOMENDAÇÕES');
    
    if (totalTitleProbability !== 100) {
      console.log('🔴 PRIORIDADE ALTA: Corrigir algoritmo de simulação');
    }
    
    if (titleChances[0]?.title_probability > 80) {
      console.log('🟡 PRIORIDADE MÉDIA: Probabilidades de título muito altas - ajustar Power Index');
    }
    
    if (relegationRisks[0]?.relegation_probability > 95) {
      console.log('🟡 PRIORIDADE MÉDIA: Riscos de rebaixamento muito altos - ajustar algoritmo');
    }

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Conexão com banco local fechada');
    }
  }
}

// Executar o diagnóstico
debugLocalSimulation();
