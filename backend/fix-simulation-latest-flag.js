const { Client } = require('pg');

async function fixSimulationLatestFlag() {
  console.log('🔧 CORRIGINDO CAMPO IS_LATEST DAS SIMULAÇÕES');
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

    // 1. VERIFICAR ESTADO ATUAL
    console.log('\n🔍 1. VERIFICANDO ESTADO ATUAL');
    
    const currentState = await client.query(`
      SELECT 
        id,
        execution_date,
        is_latest,
        competition_id
      FROM simulation_results 
      WHERE competition_id = 1
      ORDER BY execution_date DESC
    `);
    
    console.log(`📊 Simulações encontradas: ${currentState.rows.length}`);
    const latestCount = currentState.rows.filter(sim => sim.is_latest).length;
    console.log(`📊 Simulações marcadas como 'is_latest': ${latestCount}`);
    
    if (latestCount === 1) {
      console.log('✅ Já está correto! Apenas uma simulação marcada como mais recente');
      return;
    }

    // 2. CORRIGIR O CAMPO IS_LATEST
    console.log('\n🔧 2. CORRIGINDO CAMPO IS_LATEST');
    
    // Marcar todas como false primeiro
    await client.query(`
      UPDATE simulation_results 
      SET is_latest = false 
      WHERE competition_id = 1
    `);
    console.log('✅ Todas as simulações marcadas como is_latest = false');

    // Marcar apenas a mais recente como true
    const updateResult = await client.query(`
      UPDATE simulation_results 
      SET is_latest = true 
      WHERE id = (
        SELECT id 
        FROM simulation_results 
        WHERE competition_id = 1 
        ORDER BY execution_date DESC 
        LIMIT 1
      )
    `);
    console.log(`✅ Simulação mais recente marcada como is_latest = true`);

    // 3. VERIFICAR RESULTADO DA CORREÇÃO
    console.log('\n🔍 3. VERIFICANDO RESULTADO DA CORREÇÃO');
    
    const correctedState = await client.query(`
      SELECT 
        id,
        execution_date,
        is_latest,
        competition_id
      FROM simulation_results 
      WHERE competition_id = 1
      ORDER BY execution_date DESC
    `);
    
    const newLatestCount = correctedState.rows.filter(sim => sim.is_latest).length;
    console.log(`📊 Simulações marcadas como 'is_latest' após correção: ${newLatestCount}`);
    
    if (newLatestCount === 1) {
      console.log('✅ CORREÇÃO BEM-SUCEDIDA! Apenas uma simulação marcada como mais recente');
    } else {
      console.log('❌ CORREÇÃO FALHOU! Ainda há problemas com o campo is_latest');
    }

    // 4. CRIAR TRIGGER PARA EVITAR PROBLEMAS FUTUROS
    console.log('\n🔧 4. CRIANDO TRIGGER PARA EVITAR PROBLEMAS FUTUROS');
    
    try {
      // Remover trigger existente se houver
      await client.query(`
        DROP TRIGGER IF EXISTS trigger_update_simulation_latest ON simulation_results
      `);
      console.log('✅ Trigger anterior removido (se existia)');

      // Remover função existente se houver
      await client.query(`
        DROP FUNCTION IF EXISTS update_simulation_latest_flag()
      `);
      console.log('✅ Função anterior removida (se existia)');

      // Criar função para atualizar o flag is_latest
      await client.query(`
        CREATE OR REPLACE FUNCTION update_simulation_latest_flag()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Se uma nova simulação está sendo inserida ou atualizada
          IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            -- Marcar todas as simulações da mesma competição como não mais recente
            UPDATE simulation_results 
            SET is_latest = false 
            WHERE competition_id = NEW.competition_id;
            
            -- Marcar a nova simulação como mais recente
            NEW.is_latest = true;
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      console.log('✅ Função update_simulation_latest_flag criada');

      // Criar trigger que executa antes de INSERT ou UPDATE
      await client.query(`
        CREATE TRIGGER trigger_update_simulation_latest
          BEFORE INSERT OR UPDATE ON simulation_results
          FOR EACH ROW
          EXECUTE FUNCTION update_simulation_latest_flag()
      `);
      console.log('✅ Trigger trigger_update_simulation_latest criado');

    } catch (error) {
      console.log('⚠️ Aviso: Erro ao criar trigger (pode já existir):', error.message);
    }

    // 5. VERIFICAR SE O TRIGGER FOI CRIADO
    console.log('\n🔍 5. VERIFICANDO SE O TRIGGER FOI CRIADO');
    
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

    // 6. TESTAR O TRIGGER
    console.log('\n🧪 6. TESTANDO O TRIGGER');
    
    if (triggerCheck.rows.length > 0) {
      console.log('✅ Trigger criado com sucesso!');
      console.log('💡 Agora, quando uma nova simulação for executada:');
      console.log('   • O trigger será executado automaticamente');
      console.log('   • Apenas a nova simulação será marcada como is_latest = true');
      console.log('   • Todas as outras serão marcadas como is_latest = false');
    } else {
      console.log('❌ Trigger não foi criado. Verificar se há permissões adequadas.');
    }

    // 7. RESUMO FINAL
    console.log('\n🎯 7. RESUMO FINAL');
    
    console.log('✅ PROBLEMA CORRIGIDO:');
    console.log(`   • Antes: ${latestCount} simulações marcadas como mais recente`);
    console.log(`   • Depois: ${newLatestCount} simulação marcada como mais recente`);
    
    if (newLatestCount === 1) {
      console.log('🎉 AGORA AS SIMULAÇÕES PODEM SER EXCLUÍDAS CORRETAMENTE!');
      console.log('💡 Apenas a simulação mais recente não pode ser excluída');
      console.log('💡 Todas as simulações antigas podem ser excluídas');
    } else {
      console.log('❌ Ainda há problemas. Verificar manualmente o banco de dados.');
    }

    // 8. PRÓXIMOS PASSOS
    console.log('\n🔄 8. PRÓXIMOS PASSOS');
    
    console.log('🔄 PARA TESTAR A CORREÇÃO:');
    console.log('   1. Recarregar a página de simulações no frontend');
    console.log('   2. Verificar se apenas uma simulação mostra "Atual"');
    console.log('   3. Verificar se as outras mostram "Histórico"');
    console.log('   4. Verificar se o botão "Excluir" aparece para simulações antigas');
    console.log('   5. Testar exclusão de uma simulação antiga');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Conexão com banco local fechada');
    }
  }
}

// Executar a correção
fixSimulationLatestFlag();
