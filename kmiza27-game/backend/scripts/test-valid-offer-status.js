const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function testValidOfferStatus() {
  console.log('🧪 TESTANDO VALORES VÁLIDOS PARA OFFER_STATUS');
  console.log('==============================================\n');
  
  const supabase = getSupabaseServiceClient('vps');
  
  try {
    // 1. Testar com 'accepted' (valor válido)
    console.log('📋 1. Testando offer_status = "accepted"...');
    
    const { data: updateResult1, error: updateError1 } = await supabase
      .from('game_transfers')
      .update({ 
        offer_status: 'accepted'
      })
      .eq('id', '3991c8e4-b30b-46b7-a20e-28f74b1d99cd'); // Oferta do Penapolense
    
    if (updateError1) {
      console.log('❌ Erro ao atualizar para "accepted":', updateError1.message);
    } else {
      console.log('✅ Atualizado para "accepted" com sucesso');
    }
    
    // 2. Testar com 'rejected' (valor válido)
    console.log('\n📋 2. Testando offer_status = "rejected"...');
    
    const { data: updateResult2, error: updateError2 } = await supabase
      .from('game_transfers')
      .update({ 
        offer_status: 'rejected'
      })
      .eq('id', '1db9d5d0-fe93-43db-9465-016c18c0354a'); // Oferta do Atlético Mineiro
    
    if (updateError2) {
      console.log('❌ Erro ao atualizar para "rejected":', updateError2.message);
    } else {
      console.log('✅ Atualizado para "rejected" com sucesso');
    }
    
    // 3. Verificar resultado
    console.log('\n📊 3. Verificando resultado...');
    
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
      console.log('\n🏷️ STATUS ATUALIZADO:');
      offers.forEach((offer, index) => {
        console.log(`   ${index + 1}. ${offer.player_name}:`);
        console.log(`      • offer_status: ${offer.offer_status}`);
        console.log(`      • transfer_status: ${offer.transfer_status}`);
        console.log(`      • ai_decision: ${offer.ai_decision}`);
        console.log(`      • Contraproposta: R$ ${offer.counter_offer_price?.toLocaleString() || 'N/A'}`);
      });
    }
    
    console.log('\n💡 4. RECOMENDAÇÕES:');
    console.log('   • A interface deve ler transfer_status = "negotiating"');
    console.log('   • offer_status pode ser "pending", "accepted" ou "rejected"');
    console.log('   • ai_decision = "counter_offer" indica contraproposta');
    console.log('   • Interface deve mostrar botões baseado em transfer_status');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testValidOfferStatus();
