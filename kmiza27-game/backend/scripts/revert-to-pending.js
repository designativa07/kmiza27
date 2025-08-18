const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function revertToPending() {
  console.log('🔄 REVERTENDO OFFER_STATUS PARA "pending"');
  console.log('==========================================\n');
  
  const supabase = getSupabaseServiceClient('vps');
  
  try {
    // Reverter para "pending"
    console.log('📋 Revertendo offer_status para "pending"...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('game_transfers')
      .update({ 
        offer_status: 'pending'
      })
      .eq('buying_team_id', '2ddad822-bc1b-4b3b-ad8d-2b733e153bf9')
      .eq('transfer_status', 'negotiating');
    
    if (updateError) {
      console.log('❌ Erro ao reverter:', updateError.message);
      return;
    }
    
    console.log('✅ Revertido para "pending" com sucesso');
    
    // Verificar resultado
    console.log('\n📊 Verificando resultado...');
    
    const { data: offers, error: offersError } = await supabase
      .from('game_transfers')
      .select('player_name, offer_status, transfer_status, ai_decision, counter_offer_price')
      .eq('buying_team_id', '2ddad822-bc1b-4b3b-ad8d-2b733e153bf9');
    
    if (offersError) {
      console.log('❌ Erro ao verificar:', offersError.message);
      return;
    }
    
    console.log(`📋 Suas ofertas: ${offers?.length || 0}`);
    
    if (offers && offers.length > 0) {
      console.log('\n🏷️ STATUS FINAL:');
      offers.forEach((offer, index) => {
        console.log(`   ${index + 1}. ${offer.player_name}:`);
        console.log(`      • offer_status: ${offer.offer_status}`);
        console.log(`      • transfer_status: ${offer.transfer_status}`);
        console.log(`      • ai_decision: ${offer.ai_decision}`);
        console.log(`      • Contraproposta: R$ ${offer.counter_offer_price?.toLocaleString() || 'N/A'}`);
      });
    }
    
    console.log('\n🔍 PROBLEMA IDENTIFICADO:');
    console.log('   • A interface está lendo offer_status em vez de transfer_status');
    console.log('   • transfer_status = "negotiating" indica contraproposta');
    console.log('   • offer_status = "pending" é o valor padrão');
    console.log('   • Interface deve mostrar botões baseado em transfer_status');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

revertToPending();
