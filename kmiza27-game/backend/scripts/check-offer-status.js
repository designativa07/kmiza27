const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function checkOfferStatus() {
  console.log('🔍 VERIFICANDO STATUS DAS OFERTAS E CONTRAPROPOSTAS');
  console.log('====================================================\n');
  
  const supabase = getSupabaseServiceClient('vps');
  
  try {
    // 1. Verificar todas as ofertas relacionadas ao seu time
    console.log('📋 1. Verificando ofertas do seu time...');
    
    const { data: yourOffers, error: offersError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('buying_team_id', '2ddad822-bc1b-4b3b-ad8d-2b733e153bf9')
      .order('created_at', { ascending: false });
    
    if (offersError) {
      console.log('❌ Erro ao buscar ofertas:', offersError.message);
      return;
    }
    
    console.log(`📊 Total de ofertas do seu time: ${yourOffers?.length || 0}`);
    
    if (yourOffers && yourOffers.length > 0) {
      console.log('\n🏷️ SUAS OFERTAS:');
      yourOffers.forEach((offer, index) => {
        console.log(`\n   ${index + 1}. ID: ${offer.id}`);
        console.log(`      • Status: ${offer.transfer_status}`);
        console.log(`      • Offer Status: ${offer.offer_status}`);
        console.log(`      • Preço da sua oferta: R$ ${offer.offer_price?.toLocaleString() || 'N/A'}`);
        console.log(`      • Preço de listagem: R$ ${offer.listing_price?.toLocaleString() || 'N/A'}`);
        console.log(`      • Contraproposta da IA: R$ ${offer.counter_offer_price?.toLocaleString() || 'N/A'}`);
        console.log(`      • Decisão da IA: ${offer.ai_decision || 'N/A'}`);
        console.log(`      • Data: ${new Date(offer.created_at).toLocaleString('pt-BR')}`);
      });
    }
    
    // 2. Verificar contrapropostas pendentes
    console.log('\n💰 2. Verificando contrapropostas pendentes...');
    
    const { data: counterOffers, error: counterError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('buying_team_id', '2ddad822-bc1b-4b3b-ad8d-2b733e153bf9')
      .eq('transfer_status', 'negotiating');
    
    if (counterError) {
      console.log('❌ Erro ao buscar contrapropostas:', counterError.message);
      return;
    }
    
    console.log(`📊 Contrapropostas pendentes: ${counterOffers?.length || 0}`);
    
    if (counterOffers && counterOffers.length > 0) {
      console.log('\n🤖 CONTRAPROPOSTAS DA IA:');
      counterOffers.forEach((offer, index) => {
        console.log(`\n   ${index + 1}. ${offer.player_name || 'Jogador sem nome'}`);
        console.log(`      • Preço da IA: R$ ${offer.counter_offer_price?.toLocaleString() || 'N/A'}`);
        console.log(`      • Sua oferta: R$ ${offer.offer_price?.toLocaleString() || 'N/A'}`);
        console.log(`      • Status: ${offer.transfer_status}`);
        console.log(`      • Decisão da IA: ${offer.ai_decision}`);
      });
    }
    
    // 3. Verificar estrutura da tabela para entender o problema
    console.log('\n🔧 3. Verificando estrutura da tabela...');
    
    if (yourOffers && yourOffers.length > 0) {
      const sampleOffer = yourOffers[0];
      console.log('📋 Estrutura de uma oferta:');
      Object.keys(sampleOffer).forEach(key => {
        const value = sampleOffer[key];
        const type = typeof value;
        console.log(`   • ${key}: ${type} = ${JSON.stringify(value)}`);
      });
    }
    
    // 4. Recomendações
    console.log('\n💡 4. RECOMENDAÇÕES:');
    console.log('   • Verificar se transfer_status = "negotiating"');
    console.log('   • Verificar se counter_offer_price está preenchido');
    console.log('   • Verificar se ai_decision = "counter_offer"');
    console.log('   • Interface deve mostrar botões para aceitar/recusar');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkOfferStatus();
