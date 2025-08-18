const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function simpleOfferResolution() {
  console.log('🔧 RESOLUÇÃO SIMPLES DE OFERTAS PENDENTES');
  console.log('==========================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar ofertas pendentes
    console.log('📋 1. Verificando ofertas pendentes...');
    
    const { data: pendingOffers, error: pendingError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('offer_status', 'pending')
      .not('buying_team_id', 'is', null);

    if (pendingError) {
      console.log('❌ Erro ao buscar ofertas pendentes:', pendingError.message);
      return;
    }

    console.log(`📊 Ofertas pendentes encontradas: ${pendingOffers?.length || 0}`);

    if (!pendingOffers || pendingOffers.length === 0) {
      console.log('✅ Nenhuma oferta pendente encontrada!');
      return;
    }

    // 2. Mostrar detalhes das ofertas pendentes
    console.log('\n🔍 2. Detalhes das ofertas pendentes:');
    pendingOffers.forEach((offer, index) => {
      const daysAgo = offer.offer_made_at ? 
        Math.floor((Date.now() - new Date(offer.offer_made_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      console.log(`  ${index + 1}. ID: ${offer.id}`);
      console.log(`     • Preço: R$ ${offer.offer_price}`);
      console.log(`     • Dias atrás: ${daysAgo}`);
      console.log(`     • Status: ${offer.transfer_status}`);
      console.log('');
    });

    // 3. Estratégia de resolução simples
    console.log('⚡ 3. Aplicando estratégia de resolução simples...');
    console.log('💡 Estratégia: Ofertas com mais de 5 dias serão automaticamente rejeitadas');
    console.log('💡 Estratégia: Ofertas com 3-5 dias receberão status de negociação urgente');
    console.log('💡 Estratégia: Ofertas com menos de 3 dias permanecem normais\n');

    const URGENT_DAYS = 3;
    const FORCE_REJECT_DAYS = 5;
    const now = new Date();

    let forceRejected = 0;
    let markedUrgent = 0;
    let normalOffers = 0;

    for (const offer of pendingOffers) {
      if (!offer.offer_made_at) continue;
      
      const offerDate = new Date(offer.offer_made_at);
      const daysAgo = (now - offerDate) / (1000 * 60 * 60 * 24);

      if (daysAgo > FORCE_REJECT_DAYS) {
        // Forçar rejeição de ofertas muito antigas (> 5 dias)
        console.log(`⏰ Oferta ${offer.id} tem ${Math.floor(daysAgo)} dias - FORÇANDO REJEIÇÃO`);
        
        try {
          const { error: rejectError } = await supabase
            .from('game_transfers')
            .update({
              offer_status: 'rejected',
              transfer_status: 'listed',
              updated_at: now.toISOString()
            })
            .eq('id', offer.id);

          if (rejectError) {
            console.log(`❌ Erro ao rejeitar oferta ${offer.id}:`, rejectError.message);
          } else {
            console.log(`✅ Oferta ${offer.id} rejeitada automaticamente`);
            forceRejected++;
          }
        } catch (error) {
          console.log(`❌ Erro ao processar oferta ${offer.id}:`, error.message);
        }
      } else if (daysAgo > URGENT_DAYS) {
        // Marcar ofertas com 3-5 dias como urgentes (mudando status para negotiating)
        console.log(`⚠️ Oferta ${offer.id} tem ${Math.floor(daysAgo)} dias - MARCANDO COMO URGENTE`);
        
        try {
          const { error: urgentError } = await supabase
            .from('game_transfers')
            .update({
              transfer_status: 'negotiating',
              updated_at: now.toISOString()
            })
            .eq('id', offer.id);

          if (urgentError) {
            console.log(`❌ Erro ao marcar urgência da oferta ${offer.id}:`, urgentError.message);
          } else {
            console.log(`✅ Oferta ${offer.id} marcada como urgente (negotiating)`);
            markedUrgent++;
          }
        } catch (error) {
          console.log(`❌ Erro ao processar urgência da oferta ${offer.id}:`, error.message);
        }
      } else {
        // Ofertas com menos de 3 dias permanecem normais
        console.log(`✅ Oferta ${offer.id} tem ${Math.floor(daysAgo)} dias - OK`);
        normalOffers++;
      }
    }

    // 4. Verificar resultado final
    console.log('\n📊 4. Resultado final...');
    
    const { data: finalPendingOffers, error: finalError } = await supabase
      .from('game_transfers')
      .select('offer_status, transfer_status')
      .eq('offer_status', 'pending')
      .not('buying_team_id', 'is', null);

    if (finalError) {
      console.log('❌ Erro ao verificar resultado final:', finalError.message);
    } else {
      const finalStatusCounts = {};
      finalPendingOffers?.forEach(offer => {
        const status = offer.transfer_status || 'unknown';
        finalStatusCounts[status] = (finalStatusCounts[status] || 0) + 1;
      });

      console.log('📋 Status final das ofertas pendentes:');
      Object.entries(finalStatusCounts).forEach(([status, count]) => {
        console.log(`  • ${status}: ${count}`);
      });
    }

    // 5. Estatísticas de resolução
    console.log('\n📈 5. Estatísticas de resolução...');
    
    const totalProcessed = pendingOffers.length;
    const resolved = forceRejected;
    const urgent = markedUrgent;
    const normal = normalOffers;
    
    console.log(`📊 Total processado: ${totalProcessed}`);
    console.log(`✅ Resolvidas (rejeitadas): ${resolved}`);
    console.log(`⚠️ Marcadas como urgentes: ${urgent}`);
    console.log(`✅ Normais (recentes): ${normal}`);
    
    const resolutionRate = totalProcessed > 0 ? Math.round((resolved / totalProcessed) * 100) : 0;
    console.log(`📈 Taxa de resolução: ${resolutionRate}%`);

    console.log('\n🎉 RESOLUÇÃO SIMPLES CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ${forceRejected} ofertas antigas foram rejeitadas automaticamente`);
    console.log(`   • ${markedUrgent} ofertas foram marcadas como urgentes`);
    console.log(`   • ${normal} ofertas permanecem normais (recentes)`);
    console.log(`   • Taxa de resolução: ${resolutionRate}%`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Ofertas urgentes (negotiating) precisam de resposta em 48h');
    console.log('   2. Executar este script novamente em 24h para verificar progresso');
    console.log('   3. Ofertas com mais de 5 dias serão automaticamente rejeitadas');

    if (urgent > 0) {
      console.log('\n⚠️ ATENÇÃO:');
      console.log(`   • ${urgent} ofertas foram marcadas como urgentes`);
      console.log('   • Estas ofertas têm status "negotiating" e precisam de resposta');
      console.log('   • Se não houver resposta em 48h, serão rejeitadas automaticamente');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

simpleOfferResolution();
