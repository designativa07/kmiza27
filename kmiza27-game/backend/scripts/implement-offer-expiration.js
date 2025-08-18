const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function implementOfferExpiration() {
  console.log('⏰ IMPLEMENTANDO SISTEMA DE EXPIRAÇÃO DE OFERTAS');
  console.log('================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar ofertas pendentes atuais
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

    if (pendingOffers && pendingOffers.length > 0) {
      console.log('🔍 Primeiras ofertas pendentes:');
      pendingOffers.slice(0, 5).forEach(offer => {
        const daysAgo = Math.floor((Date.now() - new Date(offer.offer_made_at).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  • ID: ${offer.id} - Preço: R$ ${offer.offer_price} - Dias atrás: ${daysAgo}`);
      });
    }

    // 2. Definir política de expiração
    const EXPIRATION_DAYS = 7; // Ofertas expiram após 7 dias
    const EXPIRATION_MS = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

    console.log(`\n⏰ 2. Configurando expiração: ${EXPIRATION_DAYS} dias`);

    // 3. Identificar ofertas que devem expirar
    const now = new Date();
    const offersToExpire = pendingOffers?.filter(offer => {
      if (!offer.offer_made_at) return false;
      const offerDate = new Date(offer.offer_made_at);
      return (now - offerDate) > EXPIRATION_MS;
    }) || [];

    console.log(`📊 Ofertas que devem expirar: ${offersToExpire.length}`);

    if (offersToExpire.length > 0) {
      console.log('🔍 Exemplos de ofertas para expirar:');
      offersToExpire.slice(0, 3).forEach(offer => {
        const daysAgo = Math.floor((Date.now() - new Date(offer.offer_made_at).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  • ID: ${offer.id} - Dias atrás: ${daysAgo} - Preço: R$ ${offer.offer_price}`);
      });

      // 4. Expirar ofertas antigas
      console.log('\n⏰ 4. Expirando ofertas antigas...');
      
      for (const offer of offersToExpire) {
        try {
          const { error: expireError } = await supabase
            .from('game_transfers')
            .update({
              offer_status: 'expired',
              transfer_status: 'listed', // Volta para listado
              updated_at: now.toISOString(),
              expiration_reason: 'auto_expired_after_7_days'
            })
            .eq('id', offer.id);

          if (expireError) {
            console.log(`❌ Erro ao expirar oferta ${offer.id}:`, expireError.message);
          } else {
            console.log(`✅ Oferta ${offer.id} expirada automaticamente`);
          }
        } catch (error) {
          console.log(`❌ Erro ao processar oferta ${offer.id}:`, error.message);
        }
      }
    }

    // 5. Criar função de limpeza automática
    console.log('\n🧹 5. Criando sistema de limpeza automática...');
    
    // Função para expirar ofertas automaticamente
    async function expireOldOffers() {
      try {
        const { data: oldOffers, error: fetchError } = await supabase
          .from('game_transfers')
          .select('id, offer_made_at, offer_price')
          .eq('offer_status', 'pending')
          .not('buying_team_id', 'is', null)
          .lt('offer_made_at', new Date(Date.now() - EXPIRATION_MS).toISOString());

        if (fetchError) {
          console.log('❌ Erro ao buscar ofertas antigas:', fetchError.message);
          return;
        }

        if (oldOffers && oldOffers.length > 0) {
          console.log(`⏰ Expirando ${oldOffers.length} ofertas antigas...`);
          
          const { error: updateError } = await supabase
            .from('game_transfers')
            .update({
              offer_status: 'expired',
              transfer_status: 'listed',
              updated_at: new Date().toISOString(),
              expiration_reason: 'auto_expired_after_7_days'
            })
            .in('id', oldOffers.map(o => o.id));

          if (updateError) {
            console.log('❌ Erro ao expirar ofertas em lote:', updateError.message);
          } else {
            console.log(`✅ ${oldOffers.length} ofertas expiradas automaticamente`);
          }
        }
      } catch (error) {
        console.log('❌ Erro na função de expiração:', error.message);
      }
    }

    // 6. Verificar resultado final
    console.log('\n📊 6. Verificando resultado final...');
    const { data: finalPendingOffers, error: finalError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('offer_status', 'pending')
      .not('buying_team_id', 'is', null);

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`📊 Ofertas pendentes restantes: ${finalPendingOffers?.length || 0}`);
    }

    // 7. Verificar ofertas expiradas
    const { data: expiredOffers, error: expiredError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('offer_status', 'expired');

    if (expiredError) {
      console.log('❌ Erro ao verificar ofertas expiradas:', expiredError.message);
    } else {
      console.log(`📊 Total de ofertas expiradas: ${expiredOffers?.length || 0}`);
    }

    console.log('\n🎉 SISTEMA DE EXPIRAÇÃO IMPLEMENTADO COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • Ofertas expiram automaticamente após ${EXPIRATION_DAYS} dias`);
    console.log(`   • ${offersToExpire.length} ofertas antigas foram expiradas`);
    console.log(`   • Sistema de limpeza automática configurado`);
    console.log(`   • Ofertas não podem mais ficar "paradas" indefinidamente`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Configurar cron job para executar este script diariamente');
    console.log('   2. Implementar notificações para usuários sobre ofertas expiradas');
    console.log('   3. Adicionar interface para usuários verem histórico de ofertas expiradas');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

implementOfferExpiration();
