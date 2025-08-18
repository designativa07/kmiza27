const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function forceResolvePendingOffers() {
  console.log('⚡ FORÇANDO RESOLUÇÃO DE OFERTAS PENDENTES');
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

    // 3. Estratégia de resolução forçada
    console.log('⚡ 3. Aplicando estratégia de resolução forçada...');
    console.log('💡 Estratégia: Ofertas com mais de 3 dias serão automaticamente rejeitadas');
    console.log('💡 Estratégia: Ofertas com menos de 3 dias receberão notificação de urgência\n');

    const FORCE_REJECT_DAYS = 3;
    const FORCE_REJECT_MS = FORCE_REJECT_DAYS * 24 * 60 * 60 * 1000;
    const now = new Date();

    let forceRejected = 0;
    let urgentNotifications = 0;

    for (const offer of pendingOffers) {
      if (!offer.offer_made_at) continue;
      
      const offerDate = new Date(offer.offer_made_at);
      const daysAgo = (now - offerDate) / (1000 * 60 * 60 * 24);

      if (daysAgo > FORCE_REJECT_DAYS) {
        // Forçar rejeição de ofertas muito antigas
        console.log(`⏰ Oferta ${offer.id} tem ${Math.floor(daysAgo)} dias - FORÇANDO REJEIÇÃO`);
        
        try {
          const { error: rejectError } = await supabase
            .from('game_transfers')
            .update({
              offer_status: 'rejected',
              transfer_status: 'listed',
              updated_at: now.toISOString(),
              rejection_reason: 'auto_rejected_after_3_days_no_response',
              ai_decision: 'auto_reject',
              ai_decision_at: now.toISOString()
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
      } else if (daysAgo > 1) {
        // Marcar ofertas com mais de 1 dia como urgentes
        console.log(`⚠️ Oferta ${offer.id} tem ${Math.floor(daysAgo)} dias - MARCANDO COMO URGENTE`);
        
        try {
          const { error: urgentError } = await supabase
            .from('game_transfers')
            .update({
              transfer_status: 'urgent_response_needed',
              updated_at: now.toISOString(),
              urgency_note: `Oferta pendente há ${Math.floor(daysAgo)} dias - resposta urgente necessária`
            })
            .eq('id', offer.id);

          if (urgentError) {
            console.log(`❌ Erro ao marcar urgência da oferta ${offer.id}:`, urgentError.message);
          } else {
            console.log(`✅ Oferta ${offer.id} marcada como urgente`);
            urgentNotifications++;
          }
        } catch (error) {
          console.log(`❌ Erro ao processar urgência da oferta ${offer.id}:`, error.message);
        }
      } else {
        console.log(`✅ Oferta ${offer.id} tem ${Math.floor(daysAgo)} dias - OK`);
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
    const urgent = urgentNotifications;
    const remaining = totalProcessed - resolved;
    
    console.log(`📊 Total processado: ${totalProcessed}`);
    console.log(`✅ Resolvidas: ${resolved}`);
    console.log(`⚠️ Marcadas como urgentes: ${urgent}`);
    console.log(`⏳ Restantes pendentes: ${remaining}`);
    
    const resolutionRate = totalProcessed > 0 ? Math.round((resolved / totalProcessed) * 100) : 0;
    console.log(`📈 Taxa de resolução: ${resolutionRate}%`);

    console.log('\n🎉 RESOLUÇÃO FORÇADA CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ${forceRejected} ofertas antigas foram rejeitadas automaticamente`);
    console.log(`   • ${urgentNotifications} ofertas foram marcadas como urgentes`);
    console.log(`   • ${remaining} ofertas ainda estão pendentes (recentes)`);
    console.log(`   • Taxa de resolução: ${resolutionRate}%`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Usuários devem responder às ofertas urgentes em 24h');
    console.log('   2. Executar este script novamente em 24h para verificar progresso');
    console.log('   3. Configurar notificações automáticas para ofertas urgentes');

    if (remaining > 0) {
      console.log('\n⚠️ ATENÇÃO:');
      console.log(`   • ${remaining} ofertas ainda estão pendentes`);
      console.log('   • Estas são ofertas recentes (< 3 dias)');
      console.log('   • Executar este script novamente em 24h para continuar a limpeza');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

forceResolvePendingOffers();
