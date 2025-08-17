const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testNotificationsSimple() {
  try {
    console.log('🧪 Testando notificações simples...');
    const supabase = getSupabaseServiceClient('vps');

    // 1. Verificar se a tabela existe e tem dados
    console.log('\n🔍 Verificando tabela de notificações...');
    const { data: notifications, error: fetchError } = await supabase
      .from('market_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('❌ Erro ao buscar notificações:', fetchError);
      return;
    }

    console.log(`✅ Tabela acessível. Encontradas ${notifications.length} notificações:`);
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} - ${notif.message} (${notif.created_at})`);
    });

    // 2. Verificar se há notificações para o time específico
    if (notifications.length > 0) {
      const teamId = notifications[0].team_id;
      console.log(`\n🔍 Verificando notificações para o time ${teamId}...`);
      
      const { data: teamNotifications, error: teamError } = await supabase
        .from('market_notifications')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (teamError) {
        console.error('❌ Erro ao buscar notificações do time:', teamError);
      } else {
        console.log(`✅ Encontradas ${teamNotifications.length} notificações para o time ${teamId}`);
      }
    }

    // 3. Verificar estrutura da tabela
    console.log('\n🔍 Verificando estrutura da tabela...');
    const { data: structure, error: structureError } = await supabase
      .from('market_notifications')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError);
    } else if (structure && structure.length > 0) {
      console.log('✅ Estrutura da tabela:');
      console.log('   Colunas:', Object.keys(structure[0]));
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    console.error('   Stack:', error.stack);
  }
}

// Executar teste
testNotificationsSimple()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
