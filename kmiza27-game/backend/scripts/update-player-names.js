const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function updatePlayerNames() {
  console.log('🔧 ATUALIZANDO NOMES DOS JOGADORES NO MERCADO');
  console.log('==============================================\n');
  
  const supabase = getSupabaseServiceClient('vps');
  
  try {
    // 1. Buscar todas as listagens sem nome
    console.log('📋 1. Buscando listagens sem nome...');
    
    const { data: listingsWithoutNames, error: listingsError } = await supabase
      .from('game_transfers')
      .select('id, player_id, player_name')
      .eq('transfer_status', 'listed')
      .or('player_name.is.null,player_name.eq.Sem nome');
    
    if (listingsError) {
      console.log('❌ Erro ao buscar listagens:', listingsError.message);
      return;
    }
    
    console.log(`🔍 Encontradas ${listingsWithoutNames?.length || 0} listagens sem nome`);
    
    if (!listingsWithoutNames || listingsWithoutNames.length === 0) {
      console.log('✅ Todas as listagens já têm nomes!');
      return;
    }
    
    // 2. Atualizar nomes dos jogadores
    console.log('\n🔄 2. Atualizando nomes dos jogadores...');
    
    let totalUpdated = 0;
    let totalErrors = 0;
    
    for (const listing of listingsWithoutNames) {
      try {
        // Buscar nome do jogador
        const { data: player, error: playerError } = await supabase
          .from('game_players')
          .select('name')
          .eq('id', listing.player_id)
          .single();
        
        if (playerError || !player) {
          console.log(`   ❌ Jogador ${listing.player_id}: Não encontrado`);
          totalErrors++;
          continue;
        }
        
        // Atualizar nome na listagem
        const { error: updateError } = await supabase
          .from('game_transfers')
          .update({ player_name: player.name })
          .eq('id', listing.id);
        
        if (updateError) {
          console.log(`   ❌ ${player.name}: ${updateError.message}`);
          totalErrors++;
        } else {
          console.log(`   ✅ ${player.name}: Nome atualizado`);
          totalUpdated++;
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao processar ${listing.id}: ${error.message}`);
        totalErrors++;
      }
    }
    
    // 3. Resumo final
    console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA!');
    console.log('==========================');
    console.log(`✅ ${totalUpdated} nomes atualizados`);
    console.log(`❌ ${totalErrors} erros`);
    
    // 4. Verificar resultado
    console.log('\n📊 4. Verificando resultado...');
    
    const { data: allListings, error: finalError } = await supabase
      .from('game_transfers')
      .select('player_name, listing_price, transfer_status')
      .eq('transfer_status', 'listed');
    
    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`📋 Total de listagens no mercado: ${allListings?.length || 0}`);
      
      if (allListings && allListings.length > 0) {
        console.log('\n🏷️ LISTAGENS COM NOMES:');
        allListings.slice(0, 10).forEach((listing, index) => {
          console.log(`   ${index + 1}. ${listing.player_name}: R$ ${listing.listing_price?.toLocaleString()}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

updatePlayerNames();
