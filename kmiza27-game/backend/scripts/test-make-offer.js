const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testMakeOffer() {
  try {
    console.log('🧪 Testando método makeOffer...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Buscar um jogador listado para teste
    const { data: listedPlayers, error: listError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('transfer_status', 'listed')
      .limit(1)
      .single();

    if (listError || !listedPlayers) {
      console.error('❌ Erro ao buscar jogador listado:', listError);
      return;
    }

    console.log(`✅ Jogador encontrado: ${listedPlayers.player_id}`);
    console.log(`   Preço: R$ ${listedPlayers.listing_price}`);
    console.log(`   Time vendedor: ${listedPlayers.selling_team_id}`);

    // 2. Buscar um time diferente para fazer a oferta
    const { data: otherTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .neq('id', listedPlayers.selling_team_id)
      .limit(1)
      .single();

    if (teamsError || !otherTeams) {
      console.error('❌ Erro ao buscar time para oferta:', teamsError);
      return;
    }

    console.log(`✅ Time comprador: ${otherTeams.name} (${otherTeams.id})`);

    // 3. Verificar se já existe uma oferta deste time
    const { data: existingOffer, error: checkError } = await supabase
      .from('game_transfers')
      .select('id')
      .eq('player_id', listedPlayers.player_id)
      .eq('buying_team_id', otherTeams.id)
      .not('offer_price', 'is', null);

    if (checkError) {
      console.error('❌ Erro ao verificar ofertas existentes:', checkError);
      return;
    }

    if (existingOffer && existingOffer.length > 0) {
      console.log('⚠️  Já existe uma oferta deste time para este jogador');
      console.log('   Pulando teste de criação');
      return;
    }

    // 4. Tentar criar a oferta
    console.log('\n🔄 Criando oferta de teste...');
    
    const testOffer = {
      player_id: listedPlayers.player_id,
      is_youth_player: listedPlayers.is_youth_player,
      selling_team_id: listedPlayers.selling_team_id,
      buying_team_id: otherTeams.id,
      listing_price: listedPlayers.listing_price,
      offer_price: Math.floor(listedPlayers.listing_price * 0.9), // 90% do preço
      offer_status: 'pending',
      transfer_status: 'listed',
      offer_made_at: new Date().toISOString(),
      listed_at: listedPlayers.listed_at,
    };

    console.log('📋 Dados da oferta:');
    console.log('   player_id:', testOffer.player_id);
    console.log('   is_youth_player:', testOffer.is_youth_player);
    console.log('   selling_team_id:', testOffer.selling_team_id);
    console.log('   buying_team_id:', testOffer.buying_team_id);
    console.log('   listing_price:', testOffer.listing_price);
    console.log('   offer_price:', testOffer.offer_price);
    console.log('   offer_status:', testOffer.offer_status);
    console.log('   transfer_status:', testOffer.transfer_status);

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
testMakeOffer()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
