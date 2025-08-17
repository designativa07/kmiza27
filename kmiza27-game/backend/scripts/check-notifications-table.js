const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function checkNotificationsTable() {
  try {
    console.log('🔍 Verificando tabela market_notifications...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Verificar se a tabela existe
    const { data: notifications, error: tableError } = await supabase
      .from('market_notifications')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela market_notifications:', tableError);
      console.log('   A tabela pode não existir ou não estar acessível');
      return;
    }

    console.log('✅ Tabela market_notifications acessível');

    // 2. Verificar estrutura da tabela
    if (notifications && notifications.length > 0) {
      console.log('\n📋 Estrutura da tabela:');
      Object.keys(notifications[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof notifications[0][key]}`);
      });
    } else {
      console.log('\n📋 Tabela vazia - verificando estrutura via inserção de teste');
      
      // Tentar inserir uma notificação de teste
      const testNotification = {
        team_id: 'test-team-id',
        type: 'offer_received',
        title: 'Teste',
        message: 'Notificação de teste',
        data: { test: true },
        read: false
      };

      const { data: testInsert, error: insertError } = await supabase
        .from('market_notifications')
        .insert(testNotification)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir notificação de teste:', insertError);
        console.error('   Código:', insertError.code);
        console.error('   Mensagem:', insertError.message);
        
        if (insertError.details) {
          console.error('   Detalhes:', insertError.details);
        }
      } else {
        console.log('✅ Inserção de teste bem-sucedida');
        console.log('   ID:', testInsert.id);
        
        // Limpar dados de teste
        const { error: deleteError } = await supabase
          .from('market_notifications')
          .delete()
          .eq('id', testInsert.id);

        if (deleteError) {
          console.error('⚠️  Erro ao limpar teste:', deleteError);
        } else {
          console.log('🧹 Dados de teste removidos');
        }
      }
    }

    // 3. Verificar se há notificações existentes
    const { data: allNotifications, error: countError } = await supabase
      .from('market_notifications')
      .select('id', { count: 'exact' });

    if (!countError) {
      console.log(`\n📊 Total de notificações: ${allNotifications.length}`);
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkNotificationsTable()
  .then(() => {
    console.log('\n✅ Verificação concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
