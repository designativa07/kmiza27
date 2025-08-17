const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testAPIMakeOffer() {
  try {
    console.log('🧪 Testando API make-offer...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Buscar um jogador listado para teste
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

    // 3. Simular os dados que o frontend enviaria
    const requestBody = {
      playerId: listedPlayer.player_id,
      buyingTeamId: otherTeam.id,
      offerPrice: Math.floor(listedPlayer.listing_price * 0.9),
      isYouth: listedPlayer.is_youth_player
    };

    console.log('\n📋 Dados da requisição:');
    console.log('   playerId:', requestBody.playerId);
    console.log('   buyingTeamId:', requestBody.buyingTeamId);
    console.log('   offerPrice:', requestBody.offerPrice);
    console.log('   isYouth:', requestBody.isYouth);

    // 4. Verificar se os dados são válidos
    if (!requestBody.playerId || !requestBody.buyingTeamId || !requestBody.offerPrice) {
      console.error('❌ Dados inválidos na requisição');
      return;
    }

    // 5. Verificar se o jogador ainda está disponível
    const { data: currentListing, error: currentError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('player_id', requestBody.playerId)
      .eq('is_youth_player', requestBody.isYouth)
      .eq('transfer_status', 'listed');

    if (currentError || !currentListing || currentListing.length === 0) {
      console.error('❌ Jogador não está mais disponível:', currentError);
      return;
    }

    console.log('✅ Jogador ainda está disponível para transferência');

    // 6. Verificar se já existe uma oferta deste time
    const { data: existingOffer, error: checkError } = await supabase
      .from('game_transfers')
      .select('id')
      .eq('player_id', requestBody.playerId)
      .eq('buying_team_id', requestBody.buyingTeamId)
      .not('offer_price', 'is', null);

    if (checkError) {
      console.error('❌ Erro ao verificar ofertas existentes:', checkError);
      return;
    }

    if (existingOffer && existingOffer.length > 0) {
      console.log('⚠️  Já existe uma oferta deste time para este jogador');
      return;
    }

    // 7. Tentar criar a oferta (simulando o que o backend faria)
    console.log('\n🔄 Criando oferta...');
    
    const transfer = currentListing[0];
    const testOffer = {
      player_id: requestBody.playerId,
      is_youth_player: requestBody.isYouth,
      selling_team_id: transfer.selling_team_id,
      buying_team_id: requestBody.buyingTeamId,
      listing_price: transfer.listing_price,
      offer_price: requestBody.offerPrice,
      offer_status: 'pending',
      transfer_status: 'listed',
      offer_made_at: new Date().toISOString(),
      listed_at: transfer.listed_at,
    };

    const { data: newOffer, error: insertError } = await supabase
      .from('game_transfers')
      .insert(testOffer)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar oferta:', insertError);
      console.error('   Código:', insertError.code);
      console.error('   Mensagem:', insertError.message);
      
      if (insertError.details) {
        console.error('   Detalhes:', insertError.details);
      }
    } else {
      console.log('✅ Oferta criada com sucesso!');
      console.log(`   ID: ${newOffer.id}`);
      console.log(`   Preço: R$ ${newOffer.offer_price}`);
      
      // Limpar a oferta de teste
      const { error: deleteError } = await supabase
        .from('game_transfers')
        .delete()
        .eq('id', newOffer.id);

      if (deleteError) {
        console.error('⚠️  Erro ao limpar oferta de teste:', deleteError);
      } else {
        console.log('🧹 Oferta de teste removida');
      }
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Executar teste
testAPIMakeOffer()
  .then(() => {
    console.log('\n✅ Teste da API concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
