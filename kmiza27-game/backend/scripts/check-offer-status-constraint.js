const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function checkOfferStatusConstraint() {
  console.log('🔍 VERIFICANDO CONSTRAINT DE OFFER_STATUS');
  console.log('==========================================\n');
  
  const supabase = getSupabaseServiceClient('vps');
  
  try {
    // 1. Verificar estrutura da tabela
    console.log('📋 1. Verificando estrutura da tabela game_transfers...');
    
    const { data: sampleTransfer, error: sampleError } = await supabase
      .from('game_transfers')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Erro ao buscar amostra:', sampleError.message);
      return;
    }
    
    if (sampleTransfer && sampleTransfer.length > 0) {
      const transfer = sampleTransfer[0];
      console.log('✅ Estrutura da tabela game_transfers:');
      Object.keys(transfer).forEach(key => {
        const value = transfer[key];
        const type = typeof value;
        console.log(`   • ${key}: ${type} = ${JSON.stringify(value)}`);
      });
    }
    
    // 2. Verificar valores atuais de offer_status
    console.log('\n📊 2. Verificando valores atuais de offer_status...');
    
    const { data: offerStatuses, error: statusError } = await supabase
      .from('game_transfers')
      .select('offer_status')
      .not('offer_status', 'is', null);
    
    if (statusError) {
      console.log('❌ Erro ao buscar offer_status:', statusError.message);
      return;
    }
    
    const uniqueStatuses = [...new Set(offerStatuses.map(item => item.offer_status))];
    console.log('✅ Valores únicos de offer_status encontrados:');
    uniqueStatuses.forEach(status => {
      const count = offerStatuses.filter(item => item.offer_status === status).length;
      console.log(`   • "${status}": ${count} ocorrências`);
    });
    
    // 3. Tentar inserir com diferentes valores para identificar o problema
    console.log('\n🧪 3. Testando inserção com diferentes valores...');
    
    const testValues = ['pending', 'accepted', 'rejected', 'expired', 'counter_offer', 'none'];
    
    for (const testValue of testValues) {
      try {
        const testData = {
          player_id: '00000000-0000-0000-0000-000000000000', // UUID inválido para teste
          selling_team_id: '00000000-0000-0000-0000-000000000000', // UUID inválido para teste
          listing_price: 1000,
          transfer_status: 'listed',
          offer_status: testValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('game_transfers')
          .insert(testData);
        
        if (insertError) {
          console.log(`   ❌ "${testValue}": ${insertError.message}`);
        } else {
          console.log(`   ✅ "${testValue}": Aceito`);
        }
      } catch (error) {
        console.log(`   ❌ "${testValue}": ${error.message}`);
      }
    }
    
    // 4. Verificar constraints da tabela
    console.log('\n🔧 4. Verificando constraints da tabela...');
    
    try {
      const { data: constraints, error: constraintError } = await supabase
        .rpc('get_table_constraints', { table_name: 'game_transfers' });
      
      if (constraintError) {
        console.log('❌ RPC não disponível para constraints');
        console.log('💡 Dica: Verifique manualmente no Supabase Dashboard');
      } else {
        console.log('✅ Constraints encontradas:', constraints);
      }
    } catch (error) {
      console.log('❌ Erro ao verificar constraints:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkOfferStatusConstraint();
