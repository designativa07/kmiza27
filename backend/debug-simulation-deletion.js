const { Client } = require('pg');

async function debugSimulationDeletion() {
  console.log('🔍 DEBUGANDO PROBLEMA DE EXCLUSÃO DE SIMULAÇÕES');
  console.log('================================================\n');

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

    // 1. VERIFICAR TODAS AS SIMULAÇÕES
    console.log('\n🔍 1. VERIFICANDO TODAS AS SIMULAÇÕES');
    
    const allSimulations = await client.query(`
      SELECT 
        id,
        execution_date,
        simulation_count,
        algorithm_version,
        is_latest,
        competition_id
      FROM simulation_results 
      WHERE competition_id = 1
      ORDER BY execution_date DESC
    `);
    
    console.log(`📊 Total de simulações encontradas: ${allSimulations.rows.length}`);
    
    allSimulations.rows.forEach((sim, index) => {
      console.log(`\n  ${index + 1}. Simulação ID: ${sim.id}`);
      console.log(`     Data: ${sim.execution_date}`);
      console.log(`     Simulações: ${sim.simulation_count.toLocaleString()}`);
      console.log(`     Versão: ${sim.algorithm_version}`);
      console.log(`     É a mais recente: ${sim.is_latest ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`     Competition ID: ${sim.competition_id}`);
    });

    // 2. VERIFICAR PROBLEMA DO CAMPO IS_LATEST
    console.log('\n🔍 2. VERIFICANDO PROBLEMA DO CAMPO IS_LATEST');
    
    const latestCount = allSimulations.rows.filter(sim => sim.is_latest).length;
    console.log(`📊 Simulações marcadas como 'is_latest': ${latestCount}`);
    
    if (latestCount === 0) {
      console.log('❌ PROBLEMA: Nenhuma simulação marcada como mais recente!');
    } else if (latestCount === 1) {
      console.log('✅ CORRETO: Apenas uma simulação marcada como mais recente');
    } else {
      console.log(`❌ PROBLEMA: ${latestCount} simulações marcadas como mais recente (deveria ser apenas 1)`);
    }

    // 3. VERIFICAR SE HÁ PROBLEMA NO TRIGGER
    console.log('\n🔍 3. VERIFICANDO TRIGGER DO BANCO');
    
    const triggerCheck = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'simulation_results'
    `);
    
    console.log(`📊 Triggers encontrados: ${triggerCheck.rows.length}`);
    triggerCheck.rows.forEach((trigger, index) => {
      console.log(`  ${index + 1}. Nome: ${trigger.trigger_name}`);
      console.log(`     Evento: ${trigger.event_manipulation}`);
      console.log(`     Ação: ${trigger.action_statement}`);
    });

    // 4. VERIFICAR FUNÇÃO DO TRIGGER
    console.log('\n🔍 4. VERIFICANDO FUNÇÃO DO TRIGGER');
    
    const functionCheck = await client.query(`
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_name LIKE '%simulation%'
      AND routine_type = 'FUNCTION'
    `);
    
    console.log(`📊 Funções relacionadas a simulações: ${functionCheck.rows.length}`);
    functionCheck.rows.forEach((func, index) => {
      console.log(`  ${index + 1}. Nome: ${func.routine_name}`);
      console.log(`     Definição: ${func.routine_definition ? 'Presente' : 'Ausente'}`);
    });

    // 5. VERIFICAR SE O PROBLEMA É NO BANCO OU NO FRONTEND
    console.log('\n🔍 5. VERIFICANDO SE O PROBLEMA É NO BANCO OU NO FRONTEND');
    
    // Simular o que o frontend receberia
    const frontendData = allSimulations.rows.map(sim => ({
      id: sim.id,
      execution_date: sim.execution_date,
      simulation_count: sim.simulation_count,
      executed_by: 'admin', // Valor padrão
      execution_duration_ms: 100, // Valor padrão
      algorithm_version: sim.algorithm_version,
      is_latest: sim.is_latest,
    }));
    
    console.log('\n📊 DADOS QUE O FRONTEND RECEBERIA:');
    frontendData.forEach((sim, index) => {
      const canDelete = !sim.is_latest;
      console.log(`  ${index + 1}. ID: ${sim.id} | is_latest: ${sim.is_latest} | Pode excluir: ${canDelete ? '✅ SIM' : '❌ NÃO'}`);
    });

    // 6. IDENTIFICAR O PROBLEMA
    console.log('\n🔍 6. IDENTIFICANDO O PROBLEMA');
    
    if (latestCount === 0) {
      console.log('🚨 PROBLEMA IDENTIFICADO: Nenhuma simulação marcada como mais recente!');
      console.log('💡 SOLUÇÃO: Executar nova simulação ou corrigir trigger do banco');
    } else if (latestCount > 1) {
      console.log('🚨 PROBLEMA IDENTIFICADO: Múltiplas simulações marcadas como mais recente!');
      console.log('💡 SOLUÇÃO: Corrigir trigger do banco para garantir apenas uma por competição');
    } else {
      console.log('✅ BANCO DE DADOS ESTÁ CORRETO');
      console.log('💡 O problema pode estar no frontend ou na API');
    }

    // 7. RECOMENDAÇÕES
    console.log('\n💡 7. RECOMENDAÇÕES');
    
    if (latestCount === 0) {
      console.log('🔄 AÇÕES IMEDIATAS:');
      console.log('   1. Executar nova simulação para criar uma marcada como mais recente');
      console.log('   2. Verificar se o trigger está funcionando');
      console.log('   3. Se necessário, executar SQL manual para marcar uma como mais recente');
    } else if (latestCount > 1) {
      console.log('🔄 AÇÕES IMEDIATAS:');
      console.log('   1. Corrigir trigger do banco de dados');
      console.log('   2. Executar SQL para marcar apenas uma como mais recente');
      console.log('   3. Verificar se há conflitos na lógica de negócio');
    } else {
      console.log('🔄 AÇÕES IMEDIATAS:');
      console.log('   1. Verificar se a API está retornando is_latest corretamente');
      console.log('   2. Verificar se o frontend está interpretando o campo corretamente');
      console.log('   3. Testar exclusão de simulação antiga');
    }

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
debugSimulationDeletion();
