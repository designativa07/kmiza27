const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function fixOfferStatus() {
  console.log('🔧 CORRIGINDO OFFER_STATUS PARA CONTRAPROPOSTAS');
  console.log('================================================\n');
  
  const supabase = getSupabaseServiceClient('vps');
  
  try {
    // 1. Atualizar offer_status para contrapropostas
    console.log('📋 1. Atualizando offer_status...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('game_transfers')
      .update({ 
        offer_status: 'counter_offer'
      })
      .eq('transfer_status', 'negotiating')
      .eq('ai_decision', 'counter_offer')
      .eq('buying_team_id', '2ddad822-bc1b-4b3b-ad8d-2b733e153bf9');
    
    if (updateError) {
      console.log('❌ Erro ao atualizar:', updateError.message);
      return;
    }
    
    console.log('✅ offer_status atualizado para contrapropostas');
    
    // 2. Verificar resultado
    console.log('\n📊 2. Verificando resultado...');
    
    const { data: offers, error: offersError } = await supabase
      .from('game_transfers')
      .select('player_name, offer_status, transfer_status, ai_decision, counter_offer_price')
      .eq('buying_team_id', '2ddad822-bc1b-4b3b-ad8d-2b733e153bf9')
      .eq('transfer_status', 'negotiating');
    
    if (offersError) {
      console.log('❌ Erro ao verificar:', offersError.message);
      return;
    }
    
    console.log(`📋 Ofertas em negociação: ${offers?.length || 0}`);
    
    if (offers && offers.length > 0) {
      console.log('\n🏷️ STATUS ATUALIZADO:');
      offers.forEach((offer, index) => {
        console.log(`   ${index + 1}. ${offer.player_name}:`);
        console.log(`      • offer_status: ${offer.offer_status}`);
        console.log(`      • transfer_status: ${offer.transfer_status}`);
        console.log(`      • ai_decision: ${offer.ai_decision}`);
        console.log(`      • Contraproposta: R$ ${offer.counter_offer_price?.toLocaleString()}`);
      });
    }
    
    console.log('\n💡 3. AGORA A INTERFACE DEVE MOSTRAR:');
    console.log('   • Status: "Contraproposta" ou "Em Negociação"');
    console.log('   • Botões para aceitar/recusar contraproposta');
    console.log('   • Preço da contraproposta da IA');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixOfferStatus();
