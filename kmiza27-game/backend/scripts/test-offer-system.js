const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testOfferSystem() {
  try {
    console.log('🧪 Testando sistema de ofertas...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Verificar se há jogadores listados
    const { data: listedPlayers, error: listError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('transfer_status', 'listed')
      .limit(5);

    if (listError) {
      console.error('❌ Erro ao buscar jogadores listados:', listError);
      return;
    }

    if (!listedPlayers || listedPlayers.length === 0) {
      console.log('❌ Nenhum jogador listado encontrado');
      return;
    }

    console.log(`✅ Encontrados ${listedPlayers.length} jogadores listados`);

    // 2. Pegar o primeiro jogador para teste
    const testPlayer = listedPlayers[0];
    console.log(`\n🎯 Jogador de teste: ${testPlayer.player_id}`);
    console.log(`   Preço: R$ ${testPlayer.listing_price}`);
    console.log(`   Time vendedor: ${testPlayer.selling_team_id}`);

    // 3. Verificar se já existe uma oferta para este jogador
    const { data: existingOffers, error: offersError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('player_id', testPlayer.player_id)
      .eq('transfer_status', 'offer_made');

    if (offersError) {
      console.error('❌ Erro ao verificar ofertas existentes:', offersError);
      return;
    }

    if (existingOffers && existingOffers.length > 0) {
      console.log(`⚠️  Já existem ${existingOffers.length} ofertas para este jogador`);
      console.log('   Pulando teste de criação de oferta');
    } else {
      console.log('✅ Nenhuma oferta existente encontrada');

      // 4. Tentar criar uma oferta de teste
      console.log('\n🔄 Criando oferta de teste...');
      
      const testOffer = {
        player_id: testPlayer.player_id,
        is_youth_player: testPlayer.is_youth_player,
        selling_team_id: testPlayer.selling_team_id,
        buying_team_id: testPlayer.selling_team_id, // Usar o mesmo time para teste
        listing_price: testPlayer.listing_price,
        offer_price: Math.floor(testPlayer.listing_price * 0.9), // 90% do preço
        offer_status: 'pending',
        transfer_status: 'listed', // Usar 'listed' conforme a constraint
        offer_made_at: new Date().toISOString(),
        listed_at: testPlayer.listed_at,
      };

      const { data: newOffer, error: insertError } = await supabase
        .from('game_transfers')
        .insert(testOffer)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar oferta de teste:', insertError);
        console.error('   Código:', insertError.code);
        console.error('   Mensagem:', insertError.message);
        
        if (insertError.details) {
          console.error('   Detalhes:', insertError.details);
        }
      } else {
        console.log('✅ Oferta de teste criada com sucesso!');
        console.log(`   ID da oferta: ${newOffer.id}`);
        console.log(`   Preço da oferta: R$ ${newOffer.offer_price}`);
        
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
    }

    // 5. Verificar estrutura final
    console.log('\n📊 Resumo do sistema:');
    const { data: allListings, error: countError } = await supabase
      .from('game_transfers')
      .select('transfer_status', { count: 'exact' });

    if (!countError) {
      const statusCounts = {};
      allListings.forEach(item => {
        statusCounts[item.transfer_status] = (statusCounts[item.transfer_status] || 0) + 1;
      });

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Executar teste
testOfferSystem()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
