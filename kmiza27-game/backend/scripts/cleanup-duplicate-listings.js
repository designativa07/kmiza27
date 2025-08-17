const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function cleanupDuplicateListings() {
  try {
    console.log('🧹 Iniciando limpeza de listagens duplicadas...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Buscar todas as listagens ativas
    const { data: allListings, error: fetchError } = await supabase
      .from('game_transfers')
      .select('id, player_id, is_youth_player, listed_at, selling_team_id, listing_price')
      .eq('transfer_status', 'listed')
      .order('player_id, listed_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Erro ao buscar listagens:', fetchError);
      return;
    }

    if (!allListings || allListings.length === 0) {
      console.log('✅ Nenhuma listagem encontrada');
      return;
    }

    console.log(`📋 Total de listagens encontradas: ${allListings.length}`);

    // 2. Identificar jogadores duplicados
    const playerGroups = {};
    const duplicates = [];

    for (const listing of allListings) {
      const key = `${listing.player_id}-${listing.is_youth_player}`;
      
      if (!playerGroups[key]) {
        playerGroups[key] = [];
      }
      
      playerGroups[key].push(listing);
      
      if (playerGroups[key].length > 1) {
        duplicates.push(key);
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ Nenhum jogador duplicado encontrado');
      return;
    }

    console.log(`🔍 Encontrados ${duplicates.length} jogadores com listagens duplicadas`);

    // 3. Limpar duplicatas
    let totalRemoved = 0;

    for (const duplicateKey of duplicates) {
      const [playerId, isYouth] = duplicateKey.split('-');
      const listings = playerGroups[duplicateKey];
      
      console.log(`\n🔄 Processando jogador ${playerId} (${isYouth === 'true' ? 'Base' : 'Profissional'})`);
      console.log(`   📋 ${listings.length} listagens encontradas`);

      // Manter apenas a primeira (mais recente) e deletar as outras
      const [keepListing, ...duplicateListings] = listings;

      if (duplicateListings.length > 0) {
        console.log(`   🗑️  Removendo ${duplicateListings.length} listagens duplicadas`);

        for (const duplicateListing of duplicateListings) {
          const { error: deleteError } = await supabase
            .from('game_transfers')
            .delete()
            .eq('id', duplicateListing.id);

          if (deleteError) {
            console.error(`   ❌ Erro ao deletar listagem ${duplicateListing.id}:`, deleteError);
          } else {
            console.log(`   ✅ Listagem ${duplicateListing.id} removida`);
            totalRemoved++;
          }
        }
      }

      console.log(`   ✅ Jogador ${playerId} limpo - mantida listagem ${keepListing.id}`);
    }

    console.log(`\n🎉 Limpeza concluída! ${totalRemoved} listagens duplicadas removidas`);

    // 4. Verificar resultado final
    const { data: finalCount, error: countError } = await supabase
      .from('game_transfers')
      .select('id')
      .eq('transfer_status', 'listed');

    if (!countError) {
      console.log(`📊 Total de listagens ativas: ${finalCount.length}`);
    }

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar a limpeza
cleanupDuplicateListings()
  .then(() => {
    console.log('✅ Script de limpeza executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
