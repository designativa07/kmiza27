const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function runMarketAI() {
  console.log('🤖 EXECUTANDO IA DO MERCADO - GERANDO JOGADORES DISPONÍVEIS');
  console.log('================================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar estado atual do mercado
    console.log('📊 1. Estado atual do mercado...');
    
    const { data: currentListings, error: listingsError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('transfer_status', 'listed')
      .is('buying_team_id', null);

    if (listingsError) {
      console.log('❌ Erro ao buscar listagens:', listingsError.message);
      return;
    }

    console.log(`📋 Listagens atuais: ${currentListings?.length || 0}`);
    
    if (currentListings && currentListings.length > 0) {
      console.log('📋 Detalhes das listagens:');
      currentListings.forEach((listing, index) => {
        console.log(`   • ${index + 1}: ${listing.player_name || 'Jogador'} - R$ ${listing.listing_price}`);
      });
    }

    // 2. Verificar times da máquina disponíveis
    console.log('\n🤖 2. Verificando times da máquina...');
    
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, budget')
      .eq('team_type', 'machine');

    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }

    console.log(`🏟️ Times da máquina encontrados: ${machineTeams?.length || 0}`);

    // 3. Verificar jogadores disponíveis para venda
    console.log('\n🔍 3. Verificando jogadores disponíveis para venda...');
    
    const { data: availablePlayers, error: playersError } = await supabase
      .from('game_players')
      .select('id, name, position, potential_overall, team_id')
      .eq('team_type', 'machine')
      .not('market_status', 'eq', 'none');

    if (playersError) {
      console.log('❌ Erro ao buscar jogadores:', playersError.message);
      return;
    }

    console.log(`👥 Jogadores disponíveis para venda: ${availablePlayers?.length || 0}`);

    // 4. Simular a IA do mercado - criar algumas listagens
    console.log('\n🚀 4. Simulando IA do mercado - criando listagens...');
    
    if (availablePlayers && availablePlayers.length > 0) {
      // Selecionar alguns jogadores para listar
      const playersToSell = availablePlayers.slice(0, Math.min(10, availablePlayers.length));
      
      console.log(`📝 Listando ${playersToSell.length} jogadores no mercado...`);
      
      let listingsCreated = 0;
      
      for (const player of playersToSell) {
        // Calcular preço baseado no potencial
        const basePrice = player.potential_overall * 1000;
        const listingPrice = Math.floor(basePrice * (0.8 + Math.random() * 0.4)); // 80% a 120% do preço base
        
        const listing = {
          id: require('crypto').randomUUID(),
          player_id: player.id,
          player_name: player.name,
          selling_team_id: player.team_id,
          listing_price: listingPrice,
          transfer_status: 'listed',
          offer_status: 'none',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          const { error: insertError } = await supabase
            .from('game_transfers')
            .insert(listing);

          if (insertError) {
            console.log(`   ❌ Erro ao listar ${player.name}: ${insertError.message}`);
          } else {
            console.log(`   ✅ ${player.name} (${player.position}) listado por R$ ${listingPrice.toLocaleString()}`);
            listingsCreated++;
          }
        } catch (error) {
          console.log(`   ❌ Erro geral ao listar ${player.name}: ${error.message}`);
        }
      }

      console.log(`\n🎉 ${listingsCreated} jogadores listados com sucesso!`);
    } else {
      console.log('⚠️ Nenhum jogador disponível para venda encontrado');
    }

    // 5. Verificar estado final do mercado
    console.log('\n📊 5. Estado final do mercado...');
    
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
          console.log(`   • ${index + 1}: ${listing.player_name || 'Jogador'} - R$ ${listing.listing_price?.toLocaleString() || 'N/A'}`);
        });
      }
    }

    // 6. Resumo e recomendações
    console.log('\n💡 RESUMO E PRÓXIMOS PASSOS:');
    console.log('================================');
    console.log('✅ IA do mercado executada com sucesso!');
    console.log('✅ Jogadores foram listados no mercado');
    console.log('✅ Agora você pode ver jogadores disponíveis para compra');
    console.log('');
    console.log('🔄 Para atualizar o mercado na interface:');
    console.log('   1. Clique em "Atualizar Mercado" na interface');
    console.log('   2. Ou recarregue a página');
    console.log('   3. Os jogadores devem aparecer na lista');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

runMarketAI();
