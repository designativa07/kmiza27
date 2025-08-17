const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testNotifications() {
  try {
    console.log('🧪 Testando sistema de notificações...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Verificar se a tabela existe
    console.log('\n🔍 Verificando se a tabela market_notifications existe...');
    const { data: tableExists, error: tableError } = await supabase
      .from('market_notifications')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela market_notifications:', tableError);
      console.log('   A tabela provavelmente não existe. Execute o SQL primeiro!');
      return;
    }

    console.log('✅ Tabela market_notifications existe');

    // 2. Verificar se há times para testar
    console.log('\n🔍 Verificando times disponíveis...');
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .limit(3);

    if (teamsError || !teams || teams.length === 0) {
      console.error('❌ Erro ao buscar times:', teamsError);
      return;
    }

    console.log(`✅ Encontrados ${teams.length} times`);
    teams.forEach(team => {
      console.log(`   - ${team.name} (${team.id})`);
    });

    // 3. Tentar criar uma notificação de teste
    console.log('\n🔍 Criando notificação de teste...');
    const testNotification = {
      team_id: teams[0].id,
      type: 'offer_received',
      title: 'Nova Oferta Recebida',
      message: 'Você recebeu uma oferta de R$ 8.000 pelo jogador João Silva',
      data: { player_id: 'test-123', offer_price: 8000 }
    };

    const { data: newNotification, error: insertError } = await supabase
      .from('market_notifications')
      .insert(testNotification)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar notificação:', insertError);
      console.error('   Código:', insertError.code);
      console.error('   Mensagem:', insertError.message);
      return;
    }

    console.log('✅ Notificação criada com sucesso!');
    console.log(`   ID: ${newNotification.id}`);
    console.log(`   Time: ${teams[0].name}`);
    console.log(`   Tipo: ${newNotification.type}`);

    // 4. Buscar notificações do time
    console.log('\n🔍 Buscando notificações do time...');
    const { data: notifications, error: fetchError } = await supabase
      .from('market_notifications')
      .select('*')
      .eq('team_id', teams[0].id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Erro ao buscar notificações:', fetchError);
      return;
    }

    console.log(`✅ Encontradas ${notifications.length} notificações`);
    notifications.forEach(notif => {
      console.log(`   - ${notif.title}: ${notif.message}`);
    });

    // 5. Marcar como lida
    console.log('\n🔍 Marcando notificação como lida...');
    const { error: updateError } = await supabase
      .from('market_notifications')
      .update({ read: true })
      .eq('id', newNotification.id);

    if (updateError) {
      console.error('❌ Erro ao marcar como lida:', updateError);
    } else {
      console.log('✅ Notificação marcada como lida');
    }

    // 6. Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('market_notifications')
      .delete()
      .eq('id', newNotification.id);

    if (deleteError) {
      console.error('⚠️  Erro ao limpar dados de teste:', deleteError);
    } else {
      console.log('✅ Dados de teste removidos');
    }

    console.log('\n🎉 Teste de notificações concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    console.error('   Stack:', error.stack);
  }
}

// Executar teste
testNotifications()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
