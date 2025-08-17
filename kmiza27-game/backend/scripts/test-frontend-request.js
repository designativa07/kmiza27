const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testFrontendRequest() {
  try {
    console.log('🧪 Simulando requisição do frontend...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Simular os dados exatos que o frontend enviaria
    const frontendData = {
      playerId: 'e79ec7f7-ad78-4b4d-bf08-1366e9244532',
      buyingTeamId: 'af6fcd3f-2a6c-4c99-8be6-0d797755ac61',
      offerPrice: 4842,
      isYouth: true
    };

    console.log('📋 Dados do frontend:');
    console.log(JSON.stringify(frontendData, null, 2));

    // 2. Verificar se o jogador existe
    console.log('\n🔍 Verificando jogador...');
    const { data: player, error: playerError } = await supabase
      .from('youth_players')
      .select('name, id')
      .eq('id', frontendData.playerId)
      .single();

    if (playerError || !player) {
      console.error('❌ Jogador não encontrado:', playerError);
      return;
    }

    console.log(`✅ Jogador: ${player.name}`);

    // 3. Verificar se o time existe
    console.log('\n🔍 Verificando time...');
    const { data: team, error: teamError } = await supabase
      .from('game_teams')
      .select('name, id')
      .eq('id', frontendData.buyingTeamId)
      .single();

    if (teamError || !team) {
      console.error('❌ Time não encontrado:', teamError);
      return;
    }

    console.log(`✅ Time: ${team.name}`);

    // 4. Verificar se o jogador está listado
    console.log('\n🔍 Verificando listagem...');
    const { data: listing, error: listingError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('player_id', frontendData.playerId)
      .eq('is_youth_player', frontendData.isYouth)
      .eq('transfer_status', 'listed')
      .single();

    if (listingError || !listing) {
      console.error('❌ Listagem não encontrada:', listingError);
      return;
    }

    console.log(`✅ Listagem encontrada - Preço: R$ ${listing.listing_price}`);

    // 5. Verificar se já existe uma oferta
    console.log('\n🔍 Verificando ofertas existentes...');
    const { data: existingOffers, error: offersError } = await supabase
      .from('game_transfers')
      .select('id')
      .eq('player_id', frontendData.playerId)
      .eq('buying_team_id', frontendData.buyingTeamId)
      .not('offer_price', 'is', null);

    if (offersError) {
      console.error('❌ Erro ao verificar ofertas:', offersError);
      return;
    }

    if (existingOffers && existingOffers.length > 0) {
      console.log('⚠️  Já existe uma oferta deste time');
      return;
    }

    console.log('✅ Nenhuma oferta existente encontrada');

    // 6. Tentar criar a oferta exatamente como o backend faria
    console.log('\n🔄 Criando oferta...');
    
    const offerData = {
      player_id: frontendData.playerId,
      is_youth_player: frontendData.isYouth,
      selling_team_id: listing.selling_team_id,
      buying_team_id: frontendData.buyingTeamId,
      listing_price: listing.listing_price,
      offer_price: frontendData.offerPrice,
      offer_status: 'pending',
      transfer_status: 'listed',
      offer_made_at: new Date().toISOString(),
      listed_at: listing.listed_at,
    };

    console.log('📋 Dados da oferta:');
    Object.entries(offerData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    const { data: newOffer, error: insertError } = await supabase
      .from('game_transfers')
      .insert(offerData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar oferta:', insertError);
      console.error('   Código:', insertError.code);
      console.error('   Mensagem:', insertError.message);
      
      if (insertError.details) {
        console.error('   Detalhes:', insertError.details);
      }
      
      if (insertError.hint) {
        console.error('   Dica:', insertError.hint);
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
testFrontendRequest()
  .then(() => {
    console.log('\n✅ Teste do frontend concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
