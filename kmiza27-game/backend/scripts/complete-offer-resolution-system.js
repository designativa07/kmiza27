const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function completeOfferResolutionSystem() {
  console.log('🚀 SISTEMA COMPLETO DE RESOLUÇÃO AUTOMÁTICA DE OFERTAS');
  console.log('=======================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Status inicial do sistema
    console.log('📊 1. Status inicial do sistema...');
    
    const { data: allOffers, error: allError } = await supabase
      .from('game_transfers')
      .select('offer_status, transfer_status')
      .not('buying_team_id', 'is', null);

    if (allError) {
      console.log('❌ Erro ao buscar ofertas:', allError.message);
      return;
    }

    const initialStatusCounts = {};
    allOffers?.forEach(offer => {
      const status = offer.offer_status || 'unknown';
      initialStatusCounts[status] = (initialStatusCounts[status] || 0) + 1;
    });

    console.log('📋 Status inicial:');
    Object.entries(initialStatusCounts).forEach(([status, count]) => {
      console.log(`  • ${status}: ${count}`);
    });

    // 2. FASE 1: Processar ofertas pendentes para times da IA
    console.log('\n🤖 2. FASE 1: Processando ofertas para times da IA...');
    
    const { data: aiPendingOffers, error: aiError } = await supabase
      .from('game_transfers')
      .select(`
        *,
        selling_team:game_teams!game_transfers_selling_team_id_fkey(
          id,
          name,
          is_user_team
        )
      `)
      .eq('offer_status', 'pending')
      .not('buying_team_id', 'is', null)
      .eq('selling_team.is_user_team', false);

    if (aiError) {
      console.log('❌ Erro ao buscar ofertas da IA:', aiError.message);
    } else {
      console.log(`📊 Ofertas pendentes para times da IA: ${aiPendingOffers?.length || 0}`);
      
      if (aiPendingOffers && aiPendingOffers.length > 0) {
        let aiProcessed = 0;
        
        for (const offer of aiPendingOffers) {
          try {
            const decision = await makeAIDecision(offer);
            await executeAIDecision(offer.id, decision, offer);
            aiProcessed++;
            console.log(`   ✅ ${offer.selling_team?.name}: ${decision}`);
          } catch (error) {
            console.log(`   ❌ Erro ao processar ${offer.selling_team?.name}:`, error.message);
          }
        }
        
        console.log(`🤖 Total processado pela IA: ${aiProcessed}`);
      }
    }

    // 3. FASE 2: Resolver contrapropostas da IA que estão pendentes há muito tempo
    console.log('\n⏰ 3. FASE 2: Resolvendo contrapropostas antigas da IA...');
    
    const { data: oldCounterOffers, error: counterError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('offer_status', 'pending')
      .not('buying_team_id', 'is', null)
      .not('counter_offer_price', 'is', null)
      .lt('offer_made_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()); // 2 dias

    if (counterError) {
      console.log('❌ Erro ao buscar contrapropostas antigas:', counterError.message);
    } else {
      console.log(`📊 Contrapropostas antigas (>2 dias): ${oldCounterOffers?.length || 0}`);
      
      if (oldCounterOffers && oldCounterOffers.length > 0) {
        let resolved = 0;
        
        for (const offer of oldCounterOffers) {
          try {
            // Se contraproposta antiga, aceitar automaticamente (IA já decidiu)
            const { error: acceptError } = await supabase
              .from('game_transfers')
              .update({
                offer_status: 'accepted',
                transfer_status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', offer.id);

            if (acceptError) {
              console.log(`   ❌ Erro ao aceitar contraproposta ${offer.id}:`, acceptError.message);
            } else {
              console.log(`   ✅ Contraproposta ${offer.id} aceita automaticamente`);
              resolved++;
            }
          } catch (error) {
            console.log(`   ❌ Erro ao processar contraproposta ${offer.id}:`, error.message);
          }
        }
        
        console.log(`⏰ Total de contrapropostas resolvidas: ${resolved}`);
      }
    }

    // 4. FASE 3: Expirar ofertas pendentes muito antigas (usuários não responderam)
    console.log('\n🧹 4. FASE 3: Expirando ofertas pendentes antigas...');
    
    const EXPIRATION_DAYS = 5;
    const EXPIRATION_MS = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    
    const { data: oldPendingOffers, error: oldError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('offer_status', 'pending')
      .not('buying_team_id', 'is', null)
      .lt('offer_made_at', new Date(Date.now() - EXPIRATION_MS).toISOString());

    if (oldError) {
      console.log('❌ Erro ao buscar ofertas antigas:', oldError.message);
    } else {
      console.log(`📊 Ofertas pendentes antigas (>${EXPIRATION_DAYS} dias): ${oldPendingOffers?.length || 0}`);
      
      if (oldPendingOffers && oldPendingOffers.length > 0) {
        let expired = 0;
        
        for (const offer of oldPendingOffers) {
          try {
            const { error: expireError } = await supabase
              .from('game_transfers')
              .update({
                offer_status: 'expired',
                transfer_status: 'listed',
                updated_at: new Date().toISOString()
              })
              .eq('id', offer.id);

            if (expireError) {
              console.log(`   ❌ Erro ao expirar oferta ${offer.id}:`, expireError.message);
            } else {
              console.log(`   ⏰ Oferta ${offer.id} expirada automaticamente`);
              expired++;
            }
          } catch (error) {
            console.log(`   ❌ Erro ao processar oferta ${offer.id}:`, error.message);
          }
        }
        
        console.log(`🧹 Total de ofertas expiradas: ${expired}`);
      }
    }

    // 5. Status final do sistema
    console.log('\n📊 5. Status final do sistema...');
    
    const { data: finalOffers, error: finalError } = await supabase
      .from('game_transfers')
      .select('offer_status, transfer_status')
      .not('buying_team_id', 'is', null);

    if (finalError) {
      console.log('❌ Erro ao verificar resultado final:', finalError.message);
    } else {
      const finalStatusCounts = {};
      finalOffers?.forEach(offer => {
        const status = offer.offer_status || 'unknown';
        finalStatusCounts[status] = (finalStatusCounts[status] || 0) + 1;
      });

      console.log('📋 Status final:');
      Object.entries(finalStatusCounts).forEach(([status, count]) => {
        console.log(`  • ${status}: ${count}`);
      });
    }

    // 6. Estatísticas de saúde do sistema
    console.log('\n🏥 6. Saúde do sistema...');
    
    const totalOffers = allOffers?.length || 0;
    const finalPendingCount = finalStatusCounts?.pending || 0;
    const finalExpiredCount = finalStatusCounts?.expired || 0;
    const finalCompletedCount = finalStatusCounts?.accepted || 0;
    
    const finalHealthScore = totalOffers > 0 ? 
      Math.round(((finalCompletedCount + finalExpiredCount) / totalOffers) * 100) : 100;
    
    console.log(`📊 Total de ofertas: ${totalOffers}`);
    console.log(`⏳ Pendentes: ${finalPendingCount}`);
    console.log(`⏰ Expiradas: ${finalExpiredCount}`);
    console.log(`✅ Completadas: ${finalCompletedCount}`);
    console.log(`🏥 Saúde do sistema: ${finalHealthScore}%`);

    if (finalHealthScore >= 80) {
      console.log('✅ Sistema saudável - Ofertas sendo processadas adequadamente');
    } else if (finalHealthScore >= 60) {
      console.log('⚠️ Sistema com atenção - Algumas ofertas podem estar travando');
    } else {
      console.log('❌ Sistema com problemas - Muitas ofertas pendentes');
    }

    console.log('\n🎉 SISTEMA COMPLETO DE RESOLUÇÃO IMPLEMENTADO COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • Ofertas para times da IA são processadas automaticamente`);
    console.log(`   • Contrapropostas antigas são aceitas automaticamente`);
    console.log(`   • Ofertas pendentes expiram após ${EXPIRATION_DAYS} dias`);
    console.log(`   • Saúde do sistema: ${finalHealthScore}%`);
    console.log(`   • Ofertas não podem mais ficar "paradas" indefinidamente`);

    console.log('\n💡 COMO FUNCIONA AGORA:');
    console.log('   1. ✅ Ofertas para times da IA → Processadas automaticamente pela IA');
    console.log('   2. ✅ Contrapropostas antigas → Aceitas automaticamente');
    console.log('   3. ✅ Ofertas pendentes antigas → Expiraram automaticamente');
    console.log('   4. ✅ Usuários recebem respostas rápidas da IA');
    console.log('   5. ✅ Sistema sempre limpo e funcional');

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Executar este script a cada 2-4 horas para manutenção automática');
    console.log('   2. Configurar cron job para execução automática');
    console.log('   3. Monitorar saúde do sistema (deve ficar acima de 80%)');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Função para IA tomar decisão sobre oferta
async function makeAIDecision(offer) {
  // Critérios inteligentes para decisão da IA
  
  // 1. Se a oferta é muito baixa (menos de 50% do preço listado), rejeitar
  if (offer.offer_price < (offer.listing_price * 0.5)) {
    return 'reject';
  }
  
  // 2. Se a oferta é muito alta (mais de 150% do preço listado), aceitar
  if (offer.offer_price > (offer.listing_price * 1.5)) {
    return 'accept';
  }
  
  // 3. Se a oferta está próxima do preço listado (80-120%), fazer contraproposta
  if (offer.offer_price >= (offer.listing_price * 0.8) && offer.offer_price <= (offer.listing_price * 1.2)) {
    return 'counter_offer';
  }
  
  // 4. Para outras situações, usar lógica aleatória ponderada
  const random = Math.random();
  
  if (random < 0.4) {
    return 'accept'; // 40% chance de aceitar
  } else if (random < 0.7) {
    return 'counter_offer'; // 30% chance de contraproposta
  } else {
    return 'reject'; // 30% chance de rejeitar
  }
}

// Função para executar decisão da IA
async function executeAIDecision(offerId, decision, offer) {
  const supabase = getSupabaseServiceClient('vps');
  const now = new Date();

  switch (decision) {
    case 'accept':
      // Aceitar oferta
      const { error: acceptError } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'accepted',
          transfer_status: 'completed',
          ai_decision: 'accepted',
          ai_decision_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', offerId);

      if (acceptError) {
        throw new Error(`Erro ao aceitar oferta: ${acceptError.message}`);
      }
      break;

    case 'reject':
      // Rejeitar oferta
      const { error: rejectError } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'rejected',
          transfer_status: 'listed',
          ai_decision: 'rejected',
          ai_decision_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', offerId);

      if (rejectError) {
        throw new Error(`Erro ao rejeitar oferta: ${rejectError.message}`);
      }
      break;

    case 'counter_offer':
      // Fazer contraproposta (preço médio entre oferta e listagem)
      const counterPrice = Math.round((offer.offer_price + offer.listing_price) / 2);
      
      const { error: counterError } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'pending', // Mantém pendente para resposta do usuário
          transfer_status: 'negotiating',
          ai_decision: 'counter_offer',
          ai_decision_at: now.toISOString(),
          counter_offer_price: counterPrice,
          updated_at: now.toISOString()
        })
        .eq('id', offerId);

      if (counterError) {
        throw new Error(`Erro ao fazer contraproposta: ${counterError.message}`);
      }
      break;

    default:
      throw new Error(`Decisão inválida: ${decision}`);
  }
}

completeOfferResolutionSystem();
