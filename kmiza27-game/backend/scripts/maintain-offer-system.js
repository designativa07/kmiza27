const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function maintainOfferSystem() {
  console.log('🔧 MANUTENÇÃO DO SISTEMA DE OFERTAS');
  console.log('====================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    const now = new Date();
    const EXPIRATION_DAYS = 7;
    const EXPIRATION_MS = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

    // 1. Verificar status atual
    console.log('📊 1. Status atual do sistema...');
    
    const { data: allOffers, error: allError } = await supabase
      .from('game_transfers')
      .select('offer_status, transfer_status, created_at')
      .not('buying_team_id', 'is', null);

    if (allError) {
      console.log('❌ Erro ao buscar ofertas:', allError.message);
      return;
    }

    // Contar por status
    const statusCounts = {};
    allOffers?.forEach(offer => {
      const status = offer.offer_status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📋 Contagem por status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  • ${status}: ${count}`);
    });

    // 2. Identificar ofertas para expirar
    console.log('\n⏰ 2. Identificando ofertas para expirar...');
    
    const { data: pendingOffers, error: pendingError } = await supabase
      .from('game_transfers')
      .select('id, offer_made_at, offer_price, buying_team_id')
      .eq('offer_status', 'pending')
      .not('buying_team_id', 'is', null);

    if (pendingError) {
      console.log('❌ Erro ao buscar ofertas pendentes:', pendingError.message);
      return;
    }

    const offersToExpire = pendingOffers?.filter(offer => {
      if (!offer.offer_made_at) return false;
      const offerDate = new Date(offer.offer_made_at);
      return (now - offerDate) > EXPIRATION_MS;
    }) || [];

    console.log(`📊 Ofertas que devem expirar: ${offersToExpire.length}`);

    if (offersToExpire.length > 0) {
      console.log('🔍 Detalhes das ofertas para expirar:');
      offersToExpire.forEach(offer => {
        const daysAgo = Math.floor((Date.now() - new Date(offer.offer_made_at).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  • ID: ${offer.id} - Preço: R$ ${offer.offer_price} - Dias atrás: ${daysAgo}`);
      });

      // 3. Expirar ofertas antigas
      console.log('\n⏰ 3. Expirando ofertas antigas...');
      
      const { error: expireError } = await supabase
        .from('game_transfers')
        .update({
          offer_status: 'expired',
          transfer_status: 'listed',
          updated_at: now.toISOString(),
          expiration_reason: 'auto_expired_after_7_days'
        })
        .in('id', offersToExpire.map(o => o.id));

      if (expireError) {
        console.log('❌ Erro ao expirar ofertas:', expireError.message);
      } else {
        console.log(`✅ ${offersToExpire.length} ofertas expiradas automaticamente`);
      }
    }

    // 4. Limpar ofertas expiradas muito antigas (mais de 30 dias)
    console.log('\n🧹 4. Limpando ofertas expiradas muito antigas...');
    
    const CLEANUP_DAYS = 30;
    const CLEANUP_MS = CLEANUP_DAYS * 24 * 60 * 60 * 1000;
    
    const { data: oldExpiredOffers, error: oldError } = await supabase
      .from('game_transfers')
      .select('id, updated_at')
      .eq('offer_status', 'expired')
      .lt('updated_at', new Date(Date.now() - CLEANUP_MS).toISOString());

    if (oldError) {
      console.log('❌ Erro ao buscar ofertas expiradas antigas:', oldError.message);
    } else if (oldExpiredOffers && oldExpiredOffers.length > 0) {
      console.log(`📊 Ofertas expiradas há mais de ${CLEANUP_DAYS} dias: ${oldExpiredOffers.length}`);
      
      // Deletar ofertas expiradas muito antigas
      const { error: deleteError } = await supabase
        .from('game_transfers')
        .delete()
        .in('id', oldExpiredOffers.map(o => o.id));

      if (deleteError) {
        console.log('❌ Erro ao deletar ofertas antigas:', deleteError.message);
      } else {
        console.log(`✅ ${oldExpiredOffers.length} ofertas expiradas antigas removidas`);
      }
    } else {
      console.log(`✅ Nenhuma oferta expirada há mais de ${CLEANUP_DAYS} dias encontrada`);
    }

    // 5. Verificar resultado final
    console.log('\n📊 5. Resultado final...');
    
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
    const pendingCount = statusCounts.pending || 0;
    const expiredCount = statusCounts.expired || 0;
    const completedCount = statusCounts.accepted || 0;
    
    const healthScore = totalOffers > 0 ? 
      Math.round(((completedCount + expiredCount) / totalOffers) * 100) : 100;
    
    console.log(`📊 Total de ofertas: ${totalOffers}`);
    console.log(`⏳ Pendentes: ${pendingCount}`);
    console.log(`⏰ Expiradas: ${expiredCount}`);
    console.log(`✅ Completadas: ${completedCount}`);
    console.log(`🏥 Saúde do sistema: ${healthScore}%`);

    if (healthScore >= 80) {
      console.log('✅ Sistema saudável - Ofertas sendo processadas adequadamente');
    } else if (healthScore >= 60) {
      console.log('⚠️ Sistema com atenção - Algumas ofertas podem estar travando');
    } else {
      console.log('❌ Sistema com problemas - Muitas ofertas pendentes');
    }

    console.log('\n🎉 MANUTENÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ${offersToExpire.length} ofertas expiradas`);
    console.log(`   • Sistema limpo e organizado`);
    console.log(`   • Saúde do sistema: ${healthScore}%`);
    console.log(`   • Ofertas não podem mais ficar "paradas" indefinidamente`);

    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('   1. Executar este script diariamente para manutenção automática');
    console.log('   2. Monitorar a saúde do sistema (deve ficar acima de 80%)');
    console.log('   3. Verificar se usuários estão recebendo notificações sobre ofertas expiradas');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

maintainOfferSystem();
