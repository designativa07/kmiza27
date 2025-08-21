const { DataSource } = require('typeorm');

async function testSimulationResults() {
  console.log('🔍 TESTANDO RESULTADOS DA SIMULAÇÃO MONTE CARLO');
  console.log('================================================\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'kmiza27_dev',
    entities: [],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar simulações existentes para o Brasileirão
    console.log('\n🏆 1. VERIFICANDO SIMULAÇÕES EXISTENTES PARA O BRASILEIRÃO');
    
    const simulations = await dataSource.query(`
      SELECT 
        id,
        execution_date,
        simulation_count,
        execution_duration_ms,
        algorithm_version,
        is_latest
      FROM simulation_results 
      WHERE competition_id = 1
      ORDER BY execution_date DESC
      LIMIT 5
    `);
    
    if (simulations.length === 0) {
      console.log('❌ Nenhuma simulação encontrada para o Brasileirão!');
      return;
    }
    
    console.log(`📊 Total de simulações encontradas: ${simulations.length}`);
    simulations.forEach((sim, index) => {
      console.log(`\n  ${index + 1}. Simulação ID: ${sim.id}`);
      console.log(`     Data: ${sim.execution_date}`);
      console.log(`     Simulações: ${sim.simulation_count.toLocaleString()}`);
      console.log(`     Duração: ${sim.execution_duration_ms}ms`);
      console.log(`     Versão: ${sim.algorithm_version}`);
      console.log(`     É a mais recente: ${sim.is_latest ? '✅ SIM' : '❌ NÃO'}`);
    });

    // 2. Verificar a simulação mais recente
    const latestSimulation = simulations.find(s => s.is_latest);
    if (!latestSimulation) {
      console.log('\n❌ Nenhuma simulação marcada como mais recente!');
      return;
    }

    console.log(`\n🎯 2. ANALISANDO SIMULAÇÃO MAIS RECENTE (ID: ${latestSimulation.id})`);

    // 3. Verificar dados do Power Index
    console.log('\n📊 3. VERIFICANDO DADOS DO POWER INDEX');
    
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
    
    // Mostrar top 5 times com maior Power Index
    const topPowerIndex = powerIndex
      .sort((a, b) => b.power_index - a.power_index)
      .slice(0, 5);
    
    console.log('\n🏆 TOP 5 POWER INDEX:');
    topPowerIndex.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.power_index.toFixed(1)}`);
    });

    // 4. Verificar resultados da simulação
    console.log('\n🎲 4. VERIFICANDO RESULTADOS DA SIMULAÇÃO');
    
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
    
    // Verificar se todos os times são do Brasileirão
    console.log('\n🔍 VERIFICANDO SE TODOS OS TIMES SÃO DO BRASILEIRÃO:');
    
    const teamIds = results.map(r => r.team_id);
    const uniqueTeamIds = [...new Set(teamIds)];
    
    console.log(`📊 IDs únicos de times: ${uniqueTeamIds.length}`);
    console.log(`📋 IDs dos times: ${uniqueTeamIds.join(', ')}`);
    
    // Verificar se esses times realmente participam do Brasileirão
    const competitionTeams = await dataSource.query(`
      SELECT 
        ct.team_id,
        t.name as team_name
      FROM competition_teams ct
      INNER JOIN teams t ON ct.team_id = t.id
      WHERE ct.competition_id = 1
      ORDER BY ct.team_id
    `);
    
    const validTeamIds = competitionTeams.map(ct => ct.team_id);
    console.log(`\n✅ Times válidos no Brasileirão: ${validTeamIds.length}`);
    console.log(`📋 IDs válidos: ${validTeamIds.join(', ')}`);
    
    // Verificar se há times inválidos nos resultados
    const invalidTeams = uniqueTeamIds.filter(id => !validTeamIds.includes(id));
    if (invalidTeams.length > 0) {
      console.log(`\n❌ TIMES INVÁLIDOS ENCONTRADOS: ${invalidTeams.length}`);
      console.log(`📋 IDs inválidos: ${invalidTeams.join(', ')}`);
      
      // Buscar informações sobre esses times inválidos
      const invalidTeamInfo = await dataSource.query(`
        SELECT 
          id,
          name
        FROM teams 
        WHERE id = ANY($1)
      `, [invalidTeams]);
      
      console.log('\n📋 Informações dos times inválidos:');
      invalidTeamInfo.forEach(team => {
        console.log(`  - ID: ${team.id}, Nome: ${team.name}`);
      });
    } else {
      console.log('\n✅ Todos os times nos resultados são válidos para o Brasileirão!');
    }

    // 5. Mostrar top 3 chances de título
    console.log('\n🏆 5. TOP 3 CHANCES DE TÍTULO:');
    const topTitle = results
      .sort((a, b) => b.title_probability - a.title_probability)
      .slice(0, 3);
    
    topTitle.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.title_probability.toFixed(1)}%`);
    });

    // 6. Mostrar top 3 risco de rebaixamento
    console.log('\n📉 6. TOP 3 RISCO DE REBAIXAMENTO:');
    const topRelegation = results
      .sort((a, b) => b.relegation_probability - a.relegation_probability)
      .slice(0, 3);
    
    topRelegation.forEach((team, index) => {
      console.log(`  ${index + 1}. ${team.team_name}: ${team.relegation_probability.toFixed(1)}%`);
    });

    // 7. Verificar se há times de outras competições
    console.log('\n🔍 7. VERIFICANDO TIMES DE OUTRAS COMPETIÇÕES');
    
    const otherCompetitionTeams = await dataSource.query(`
      SELECT 
        ct.team_id,
        t.name as team_name,
        c.name as competition_name,
        c.id as competition_id
      FROM competition_teams ct
      INNER JOIN teams t ON ct.team_id = t.id
      INNER JOIN competitions c ON ct.competition_id = c.id
      WHERE ct.competition_id != 1
        AND ct.team_id = ANY($1)
      ORDER BY c.name, t.name
    `, [uniqueTeamIds]);
    
    if (otherCompetitionTeams.length > 0) {
      console.log(`\n⚠️ TIMES ENCONTRADOS EM OUTRAS COMPETIÇÕES: ${otherCompetitionTeams.length}`);
      
      // Agrupar por competição
      const byCompetition = {};
      otherCompetitionTeams.forEach(team => {
        const compName = team.competition_name;
        if (!byCompetition[compName]) {
          byCompetition[compName] = [];
        }
        byCompetition[compName].push(team);
      });
      
      Object.keys(byCompetition).forEach(compName => {
        console.log(`\n  ${compName}:`);
        byCompetition[compName].forEach(team => {
          console.log(`    - ${team.team_name} (ID: ${team.team_id})`);
        });
      });
    } else {
      console.log('\n✅ Nenhum time de outras competições encontrado nos resultados!');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Conexão com banco fechada');
    }
  }
}

// Executar o teste
testSimulationResults();
