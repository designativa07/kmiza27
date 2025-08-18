const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function autoProcessAIOffers() {
  console.log('🤖 PROCESSAMENTO AUTOMÁTICO DE OFERTAS PARA TIMES DA IA');
  console.log('========================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar ofertas pendentes para times da IA
    console.log('📋 1. Verificando ofertas pendentes para times da IA...');
    
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
      return;
    }

    console.log(`📊 Ofertas pendentes para times da IA: ${aiPendingOffers?.length || 0}`);

    if (!aiPendingOffers || aiPendingOffers.length === 0) {
      console.log('✅ Nenhuma oferta pendente para times da IA encontrada!');
      return;
    }

    // 2. Mostrar detalhes das ofertas pendentes
    console.log('\n🔍 2. Detalhes das ofertas pendentes da IA:');
    aiPendingOffers.forEach((offer, index) => {
      const daysAgo = offer.offer_made_at ? 
        Math.floor((Date.now() - new Date(offer.offer_made_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      console.log(`  ${index + 1}. ID: ${offer.id}`);
      console.log(`     • Time: ${offer.selling_team?.name || 'N/A'}`);
      console.log(`     • Preço: R$ ${offer.offer_price}`);
      console.log(`     • Dias atrás: ${daysAgo}`);
      console.log(`     • Status: ${offer.transfer_status}`);
      console.log('');
    });

    // 3. Processar cada oferta da IA automaticamente
    console.log('🤖 3. Processando ofertas da IA automaticamente...');
    console.log('💡 Estratégia: IA decide automaticamente aceitar, rejeitar ou fazer contraproposta\n');

    let accepted = 0;
    let rejected = 0;
    let counterOffers = 0;
    let errors = 0;

    for (const offer of aiPendingOffers) {
      try {
        console.log(`🤖 Processando oferta ${offer.id} para ${offer.selling_team?.name}...`);
        
        // IA toma decisão baseada em critérios inteligentes
        const decision = await makeAIDecision(offer);
        console.log(`   • Decisão da IA: ${decision}`);
        
        // Executar a decisão
        await executeAIDecision(offer.id, decision, offer);
        
        // Contar resultados
        switch (decision) {
          case 'accept':
            accepted++;
            console.log(`   ✅ Oferta aceita`);
            break;
          case 'reject':
            rejected++;
            console.log(`   ❌ Oferta rejeitada`);
            break;
          case 'counter_offer':
            counterOffers++;
            console.log(`   💰 Contraproposta feita`);
            break;
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao processar oferta ${offer.id}:`, error.message);
        errors++;
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

    // 5. Estatísticas de processamento
    console.log('\n📈 5. Estatísticas de processamento...');
    
    const totalProcessed = aiPendingOffers.length;
    
    console.log(`📊 Total processado: ${totalProcessed}`);
    console.log(`✅ Aceitas: ${accepted}`);
    console.log(`❌ Rejeitadas: ${rejected}`);
    console.log(`💰 Contrapropostas: ${counterOffers}`);
    console.log(`❌ Erros: ${errors}`);
    
    const successRate = totalProcessed > 0 ? Math.round(((totalProcessed - errors) / totalProcessed) * 100) : 100;
    console.log(`📈 Taxa de sucesso: ${successRate}%`);

    console.log('\n🎉 PROCESSAMENTO AUTOMÁTICO CONCLUÍDO COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ${accepted} ofertas aceitas automaticamente pela IA`);
    console.log(`   • ${rejected} ofertas rejeitadas automaticamente pela IA`);
    console.log(`   • ${counterOffers} contrapropostas feitas automaticamente pela IA`);
    console.log(`   • ${errors} erros durante o processamento`);
    console.log(`   • Taxa de sucesso: ${successRate}%`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Executar este script sempre que houver ofertas pendentes para times da IA');
    console.log('   2. Configurar execução automática a cada 1-2 horas');
    console.log('   3. Monitorar se as decisões da IA estão sendo adequadas');

    if (errors > 0) {
      console.log('\n⚠️ ATENÇÃO:');
      console.log(`   • ${errors} erros ocorreram durante o processamento`);
      console.log('   • Verificar logs para identificar problemas');
      console.log('   • Executar script novamente para processar ofertas com erro');
    }

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

autoProcessAIOffers();
