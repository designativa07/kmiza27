const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function simpleMarketPopulate() {
  console.log('🚀 POPULANDO MERCADO COM JOGADORES - VERSÃO SIMPLES');
  console.log('====================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar jogadores da máquina disponíveis
    console.log('🔍 1. Buscando jogadores da máquina...');
    
    const { data: machinePlayers, error: playersError } = await supabase
      .from('game_players')
      .select('id, name, position, team_id')
      .eq('team_type', 'machine')
      .limit(20);

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
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

simpleMarketPopulate();
