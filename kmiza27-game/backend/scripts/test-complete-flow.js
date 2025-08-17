const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testCompleteFlow() {
  try {
    console.log('🧪 Testando fluxo completo da API...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Buscar um jogador listado para teste
    console.log('\n🔍 Buscando jogador listado para teste...');
    const { data: listedPlayer, error: listError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('transfer_status', 'listed')
      .limit(1)
      .single();

    if (listError || !listedPlayer) {
      console.error('❌ Erro ao buscar jogador listado:', listError);
      return;
    }

    console.log(`✅ Jogador encontrado: ${listedPlayer.player_id}`);
    console.log(`   Preço: R$ ${listedPlayer.listing_price}`);

    // 2. Buscar um time diferente para fazer a oferta
    console.log('\n🔍 Buscando time para fazer oferta...');
    const { data: otherTeam, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .neq('id', listedPlayer.selling_team_id)
      .limit(1)
      .single();

    if (teamsError || !otherTeam) {
      console.error('❌ Erro ao buscar time para oferta:', teamsError);
      return;
    }

    console.log(`✅ Time comprador: ${otherTeam.name} (${otherTeam.id})`);

    // 3. Simular a criação de oferta (como o backend faz)
    console.log('\n🔍 Criando oferta de teste...');
    const testOffer = {
      player_id: listedPlayer.player_id,
      is_youth_player: listedPlayer.is_youth_player,
      selling_team_id: listedPlayer.selling_team_id,
      buying_team_id: otherTeam.id,
      listing_price: listedPlayer.listing_price,
      offer_price: Math.floor(listedPlayer.listing_price * 0.9),
      offer_status: 'pending',
      transfer_status: 'listed',
      offer_made_at: new Date().toISOString(),
      listed_at: listedPlayer.listed_at,
    };

    const { data: newOffer, error: insertError } = await supabase
      .from('game_transfers')
      .insert(testOffer)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar oferta:', insertError);
      return;
    }

    console.log('✅ Oferta criada com sucesso!');
    console.log(`   ID: ${newOffer.id}`);

    // 4. Simular a criação de notificação (como o backend faria)
    console.log('\n🔍 Criando notificação de teste...');
    const testNotification = {
      team_id: listedPlayer.selling_team_id,
      type: 'offer_received',
      title: 'Nova Oferta Recebida',
      message: `${otherTeam.name} fez uma oferta de R$ ${testOffer.offer_price.toLocaleString()} por um jogador`,
      data: { 
        player_id: listedPlayer.player_id, 
        offer_price: testOffer.offer_price,
        buying_team_id: otherTeam.id,
        buying_team_name: otherTeam.name
      }
    };

    const { data: newNotification, error: notificationError } = await supabase
      .from('market_notifications')
      .insert(testNotification)
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Erro ao criar notificação:', notificationError);
      return;
    }

    console.log('✅ Notificação criada com sucesso!');
    console.log(`   ID: ${newNotification.id}`);

    // 5. Simular a busca de notificações (como o frontend faria)
    console.log('\n🔍 Buscando notificações do time vendedor...');
    const { data: notifications, error: fetchError } = await supabase
      .from('market_notifications')
      .select('*')
      .eq('team_id', listedPlayer.selling_team_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error('❌ Erro ao buscar notificações:', fetchError);
      return;
    }

    console.log(`✅ Encontradas ${notifications.length} notificações`);
    notifications.slice(0, 3).forEach(notif => {
      console.log(`   - ${notif.title}: ${notif.message}`);
    });

    // 6. Simular a busca de ofertas pendentes
    console.log('\n🔍 Buscando ofertas pendentes do time vendedor...');
    const { data: pendingOffers, error: offersError } = await supabase
      .from('game_transfers')
      .select(`
        id,
        player_id,
        is_youth_player,
        listing_price,
        offer_price,
        offer_status,
        offer_made_at,
        buying_team:game_teams!game_transfers_buying_team_id_fkey(name)
      `)
      .eq('selling_team_id', listedPlayer.selling_team_id)
      .not('buying_team_id', 'is', null)
      .not('offer_price', 'is', null)
      .order('offer_made_at', { ascending: false });

    if (offersError) {
      console.error('❌ Erro ao buscar ofertas pendentes:', offersError);
      return;
    }

    console.log(`✅ Encontradas ${pendingOffers.length} ofertas pendentes`);
    pendingOffers.slice(0, 3).forEach(offer => {
      console.log(`   - Jogador: ${offer.player_id}, Oferta: R$ ${offer.offer_price}, Time: ${offer.buying_team?.name}`);
    });

    // 7. Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    const { error: deleteOfferError } = await supabase
      .from('game_transfers')
      .delete()
      .eq('id', newOffer.id);

    if (deleteOfferError) {
      console.error('⚠️  Erro ao limpar oferta de teste:', deleteOfferError);
    } else {
      console.log('✅ Oferta de teste removida');
    }

    const { error: deleteNotificationError } = await supabase
      .from('market_notifications')
      .delete()
      .eq('id', newNotification.id);

    if (deleteNotificationError) {
      console.error('⚠️  Erro ao limpar notificação de teste:', deleteNotificationError);
    } else {
      console.log('✅ Notificação de teste removida');
    }

    console.log('\n🎉 Teste do fluxo completo concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    console.error('   Stack:', error.stack);
  }
}

// Executar teste
testCompleteFlow()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
