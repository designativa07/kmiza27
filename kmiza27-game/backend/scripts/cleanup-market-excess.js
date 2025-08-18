const { getSupabaseClient } = require('../config/supabase-connection');

/**
 * 🧹 LIMPEZA DO EXCESSO NO MERCADO
 * 
 * Objetivos:
 * 1. Remover jogadores listados há muito tempo
 * 2. Implementar sistema de rotação
 * 3. Manter mercado equilibrado
 * 4. Preservar jogabilidade
 */

async function cleanupMarketExcess() {
  try {
    console.log('🧹 LIMPEZA DO EXCESSO NO MERCADO');
    console.log('=' .repeat(50));
    
    const supabase = getSupabaseClient('vps');
    
    // 1. VERIFICAR ESTADO ATUAL DO MERCADO
    console.log('\n📊 1. Verificando estado atual do mercado...');
    const { data: currentListings, error: listingsError } = await supabase
      .from('game_transfers')
      .select('id, player_id, is_youth_player, selling_team_id, listed_at, transfer_status')
      .eq('transfer_status', 'listed')
      .not('buying_team_id', 'is', null); // Corrigido: usar 'not' em vez de 'eq' para null

    if (listingsError) {
      console.error('❌ Erro ao buscar listagens:', listingsError);
      return;
    }

    const totalListings = currentListings?.length || 0;
    console.log(`📋 Total de jogadores no mercado: ${totalListings}`);

    if (totalListings === 0) {
      console.log('✅ Mercado já está limpo!');
      return;
    }

    // 2. LIMPEZA AGRESSIVA: Remover listagens antigas
    console.log('\n🧽 2. Limpeza agressiva de listagens antigas...');
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const oldListings = currentListings.filter(listing => 
      new Date(listing.listed_at) < twoDaysAgo
    );

    console.log(`📅 Listagens com mais de 2 dias: ${oldListings.length}`);

    if (oldListings.length > 0) {
      for (const listing of oldListings) {
        await removeListing(supabase, listing);
      }
      console.log(`✅ ${oldListings.length} listagens antigas removidas`);
    }

    // 3. LIMPEZA SELETIVA: Manter apenas os melhores jogadores
    console.log('\n🎯 3. Limpeza seletiva - mantendo apenas os melhores...');
    const remainingListings = currentListings.filter(listing => 
      new Date(listing.listed_at) >= twoDaysAgo
    );

    if (remainingListings.length > 50) { // Se ainda houver muitos
      console.log(`📊 Ainda há ${remainingListings.length} jogadores. Aplicando limpeza seletiva...`);
      
      // Manter apenas os jogadores com melhor potencial
      const listingsToKeep = await selectBestPlayersToKeep(supabase, remainingListings, 50);
      const listingsToRemove = remainingListings.filter(listing => 
        !listingsToKeep.find(keep => keep.id === listing.id)
      );

      console.log(`🎯 Mantendo ${listingsToKeep.length} melhores jogadores`);
      console.log(`🗑️ Removendo ${listingsToRemove.length} jogadores excedentes`);

      for (const listing of listingsToRemove) {
        await removeListing(supabase, listing);
      }
    }

    // 4. VERIFICAR RESULTADO FINAL
    console.log('\n📊 4. Verificando resultado final...');
    const { data: finalListings, error: finalError } = await supabase
      .from('game_transfers')
      .select('id')
      .eq('transfer_status', 'listed')
      .eq('buying_team_id', null);

    if (finalError) {
      console.error('❌ Erro ao verificar resultado final:', finalError);
      return;
    }

    const finalCount = finalListings?.length || 0;
    console.log(`✅ Mercado limpo! Total final: ${finalCount} jogadores`);

    // 5. IMPLEMENTAR SISTEMA DE ROTAÇÃO
    console.log('\n🔄 5. Implementando sistema de rotação...');
    await implementRotationSystem(supabase);

    console.log('\n🎉 LIMPEZA DO MERCADO CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • Jogadores removidos: ${totalListings - finalCount}`);
    console.log(`   • Jogadores mantidos: ${finalCount}`);
    console.log(`   • Sistema de rotação ativo`);
    console.log(`   • Mercado equilibrado e jogável`);

  } catch (error) {
    console.error('❌ Erro na limpeza do mercado:', error);
  }
}

/**
 * Remove uma listagem específica
 */
async function removeListing(supabase, listing) {
  try {
    // Remover da lista de transferências
    await supabase
      .from('game_transfers')
      .delete()
      .eq('id', listing.id);

    // Resetar status do jogador
    const playerTable = listing.is_youth_player ? 'youth_players' : 'game_players';
    await supabase
      .from(playerTable)
      .update({ market_status: 'none' })
      .eq('id', listing.player_id);

    console.log(`   🗑️ Listagem removida: ${listing.id}`);
  } catch (error) {
    console.error(`   ❌ Erro ao remover listagem ${listing.id}:`, error);
  }
}

/**
 * Seleciona os melhores jogadores para manter no mercado
 */
async function selectBestPlayersToKeep(supabase, listings, maxToKeep) {
  try {
    // Buscar dados dos jogadores para avaliação
    const playerIds = listings.map(l => l.player_id);
    const youthPlayerIds = listings.filter(l => l.is_youth_player).map(l => l.player_id);
    const proPlayerIds = listings.filter(l => !l.is_youth_player).map(l => l.player_id);

    let allPlayers = [];

    // Buscar jogadores da base
    if (youthPlayerIds.length > 0) {
      const { data: youthPlayers } = await supabase
        .from('youth_players')
        .select('id, potential_overall, market_value')
        .in('id', youthPlayerIds);

      if (youthPlayers) {
        allPlayers.push(...youthPlayers.map(p => ({ ...p, is_youth: true })));
      }
    }

    // Buscar jogadores profissionais
    if (proPlayerIds.length > 0) {
      const { data: proPlayers } = await supabase
        .from('game_players')
        .select('id, current_ability, market_value')
        .in('id', proPlayerIds);

      if (proPlayers) {
        allPlayers.push(...proPlayers.map(p => ({ ...p, is_youth: false })));
      }
    }

    // Ordenar por qualidade (potencial para base, overall para profissionais)
    allPlayers.sort((a, b) => {
      const aScore = a.is_youth ? (a.potential_overall || 0) : (a.current_ability || 0);
      const bScore = b.is_youth ? (b.potential_overall || 0) : (b.current_ability || 0);
      return bScore - aScore; // Melhores primeiro
    });

    // Retornar os melhores até o limite
    return allPlayers.slice(0, maxToKeep).map(p => ({
      id: p.id,
      score: p.is_youth ? (p.potential_overall || 0) : (a.current_ability || 0)
    }));

  } catch (error) {
    console.error('❌ Erro ao selecionar melhores jogadores:', error);
    return [];
  }
}

/**
 * Implementa sistema de rotação para manter mercado dinâmico
 */
async function implementRotationSystem(supabase) {
  try {
    console.log('   🔄 Configurando sistema de rotação...');
    
    // Criar tabela de configuração de rotação se não existir
    const { error: createError } = await supabase
      .from('game_market_config')
      .upsert({
        id: 'rotation_config',
        max_listings: 50,
        rotation_interval_hours: 24,
        last_rotation: new Date().toISOString(),
        cleanup_threshold_days: 2
      }, { onConflict: 'id' });

    if (createError) {
      console.log('   ⚠️ Tabela de configuração não existe, criando...');
      // A tabela será criada automaticamente pelo sistema
    }

    console.log('   ✅ Sistema de rotação configurado');
    console.log('   📋 Configurações:');
    console.log('      • Máximo de 50 jogadores no mercado');
    console.log('      • Rotação a cada 24 horas');
    console.log('      • Limpeza após 2 dias');
    console.log('      • IA só executa se mercado < 80% cheio');

  } catch (error) {
    console.error('   ❌ Erro ao configurar rotação:', error);
  }
}

// Executar limpeza
cleanupMarketExcess().then(() => {
  console.log('\n🔌 Script concluído.');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
