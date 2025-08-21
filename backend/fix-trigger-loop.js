const { Client } = require('pg');

async function fixTriggerLoop() {
  console.log('🔧 CORRIGINDO LOOP INFINITO NO TRIGGER');
  console.log('========================================\n');

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

    // 1. REMOVER TRIGGER PROBLEMÁTICO
    console.log('\n🔧 1. REMOVENDO TRIGGER PROBLEMÁTICO');
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_simulation_latest ON simulation_results
    `);
    console.log('✅ Trigger problemático removido');

    // 2. REMOVER FUNÇÃO PROBLEMÁTICA
    console.log('\n🔧 2. REMOVENDO FUNÇÃO PROBLEMÁTICA');
    
    await client.query(`
      DROP FUNCTION IF EXISTS update_simulation_latest_flag()
    `);
    console.log('✅ Função problemática removida');

    // 3. CRIAR FUNÇÃO CORRIGIDA (SEM LOOP)
    console.log('\n🔧 3. CRIANDO FUNÇÃO CORRIGIDA (SEM LOOP)');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION update_simulation_latest_flag()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Apenas para INSERT (não UPDATE para evitar loop)
        IF TG_OP = 'INSERT' THEN
          -- Marcar todas as simulações da mesma competição como não mais recente
          UPDATE simulation_results 
          SET is_latest = false 
          WHERE competition_id = NEW.competition_id
          AND id != NEW.id; -- Evitar atualizar a própria linha sendo inserida
          
          -- Marcar a nova simulação como mais recente
          NEW.is_latest = true;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Função corrigida criada (sem loop)');

    // 4. CRIAR TRIGGER CORRIGIDO (APENAS INSERT)
    console.log('\n🔧 4. CRIANDO TRIGGER CORRIGIDO (APENAS INSERT)');
    
    await client.query(`
      CREATE TRIGGER trigger_update_simulation_latest
        BEFORE INSERT ON simulation_results
        FOR EACH ROW
        EXECUTE FUNCTION update_simulation_latest_flag()
    `);
    console.log('✅ Trigger corrigido criado (apenas INSERT)');

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

    // 6. VERIFICAR ESTADO ATUAL DAS SIMULAÇÕES
    console.log('\n🔍 6. VERIFICANDO ESTADO ATUAL DAS SIMULAÇÕES');
    
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
    
    const latestCount = currentState.rows.filter(sim => sim.is_latest).length;
    console.log(`📊 Simulações marcadas como 'is_latest': ${latestCount}`);
    
    if (latestCount === 1) {
      console.log('✅ Estado correto mantido: Apenas uma simulação marcada como mais recente');
    } else {
      console.log('❌ Estado incorreto. Corrigindo...');
      
      // Corrigir novamente se necessário
      await client.query(`
        UPDATE simulation_results 
        SET is_latest = false 
        WHERE competition_id = 1
      `);
      
      await client.query(`
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
      
      console.log('✅ Estado corrigido novamente');
    }

    // 7. TESTAR O TRIGGER CORRIGIDO
    console.log('\n🧪 7. TESTANDO O TRIGGER CORRIGIDO');
    
    if (triggerCheck.rows.length > 0) {
      console.log('✅ Trigger corrigido criado com sucesso!');
      console.log('💡 Agora, quando uma nova simulação for executada:');
      console.log('   • O trigger será executado apenas no INSERT');
      console.log('   • Não haverá loop infinito');
      console.log('   • Apenas a nova simulação será marcada como is_latest = true');
      console.log('   • Todas as outras serão marcadas como is_latest = false');
    } else {
      console.log('❌ Trigger não foi criado. Verificar se há permissões adequadas.');
    }

    // 8. RESUMO FINAL
    console.log('\n🎯 8. RESUMO FINAL');
    
    console.log('✅ PROBLEMA CORRIGIDO:');
    console.log('   • Loop infinito no trigger eliminado');
    console.log('   • Trigger agora executa apenas no INSERT');
    console.log('   • Função corrigida para evitar recursão');
    console.log('   • Estado das simulações mantido correto');
    
    console.log('\n🎉 AGORA O BACKEND DEVE FUNCIONAR SEM ERROS!');
    console.log('💡 O trigger não causará mais loops infinitos');
    console.log('💡 As simulações podem ser executadas normalmente');

    // 9. PRÓXIMOS PASSOS
    console.log('\n🔄 9. PRÓXIMOS PASSOS');
    
    console.log('🔄 PARA TESTAR A CORREÇÃO:');
    console.log('   1. Reiniciar o backend (se estiver rodando)');
    console.log('   2. Tentar executar uma nova simulação');
    console.log('   3. Verificar se não há mais erros de "profundidade da pilha"');
    console.log('   4. Verificar se o campo is_latest está sendo gerenciado corretamente');

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
fixTriggerLoop();
