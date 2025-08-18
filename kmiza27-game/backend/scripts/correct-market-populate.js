const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function correctMarketPopulate() {
  console.log('🚀 POPULANDO MERCADO CORRETAMENTE - ESTRUTURA REAL');
  console.log('===================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar jogadores da máquina disponíveis
    console.log('🔍 1. Buscando jogadores da máquina...');
    
    const { data: machinePlayers, error: playersError } = await supabase
      .from('game_players')
      .select('id, name, position, team_id')
      .eq('team_type', 'machine')
      .limit(15);

    if (playersError) {
      console.log('❌ Erro ao buscar jogadores:', playersError.message);
      return;
    }

    console.log(`👥 Encontrados ${machinePlayers?.length || 0} jogadores da máquina`);

    if (!machinePlayers || machinePlayers.length === 0) {
      console.log('⚠️ Nenhum jogador da máquina encontrado');
      return;
    }

    // 2. Criar listagens no mercado
    console.log('\n📝 2. Criando listagens no mercado...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const player of machinePlayers) {
      // Preço baseado na posição
      const basePrices = {
        'GK': 50000,
        'CB': 40000,
        'LB': 35000,
        'RB': 35000,
        'DM': 45000,
        'CM': 50000,
        'AM': 55000,
        'LW': 50000,
        'RW': 50000,
        'ST': 60000,
        'CF': 55000
      };

      const basePrice = basePrices[player.position] || 40000;
      const listingPrice = Math.floor(basePrice * (0.9 + Math.random() * 0.2)); // 90% a 110% do preço base

      // ESTRUTURA CORRETA baseada no schema real
      const listing = {
        id: require('crypto').randomUUID(),
        player_id: player.id, // ✅ CORRETO: player_id, não player_name
        is_youth_player: false,
        selling_team_id: player.team_id,
        listing_price: listingPrice,
        listed_at: new Date().toISOString(),
        buying_team_id: null,
        offer_price: null,
        offer_status: 'none',
        offer_made_at: null,
        transfer_status: 'listed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ai_decision: null,
        ai_decision_at: null,
        counter_offer_price: null,
        is_ai_team: true // ✅ Marcar como time da IA
      };

      try {
        const { error: insertError } = await supabase
          .from('game_transfers')
          .insert(listing);

        if (insertError) {
          console.log(`   ❌ ${player.name}: ${insertError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ ${player.name} (${player.position}) - R$ ${listingPrice.toLocaleString()}`);
          successCount++;
        }
      } catch (error) {
        console.log(`   ❌ ${player.name}: ${error.message}`);
        errorCount++;
      }
    }

    // 3. Resumo final
    console.log('\n🎉 RESUMO FINAL:');
    console.log('================');
    console.log(`✅ ${successCount} jogadores listados com sucesso`);
    console.log(`❌ ${errorCount} erros`);
    console.log(`📊 Total de listagens criadas: ${successCount}`);
    
    if (successCount > 0) {
      console.log('\n🔄 PRÓXIMOS PASSOS:');
      console.log('====================');
      console.log('1. Volte para a interface do jogo');
      console.log('2. Clique em "Atualizar Mercado"');
      console.log('3. Os jogadores devem aparecer na lista!');
      console.log('4. Agora você pode comprar jogadores!');
      
      // 4. Verificar estado final do mercado
      console.log('\n📊 4. Estado final do mercado...');
      
      const { data: finalListings, error: finalError } = await supabase
        .from('game_transfers')
        .select('*')
        .eq('transfer_status', 'listed')
        .is('buying_team_id', null);

      if (!finalError) {
        console.log(`📋 Total de listagens no mercado: ${finalListings?.length || 0}`);
        
        if (finalListings && finalListings.length > 0) {
          console.log('📋 Listagens disponíveis:');
          finalListings.forEach((listing, index) => {
            console.log(`   • ${index + 1}: ID ${listing.player_id} - R$ ${listing.listing_price?.toLocaleString() || 'N/A'}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

correctMarketPopulate();
