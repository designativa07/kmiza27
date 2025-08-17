const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function checkConstraints() {
  try {
    console.log('🔍 Verificando constraints da tabela game_transfers...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Verificar valores únicos em transfer_status
    const { data: statusValues, error: statusError } = await supabase
      .from('game_transfers')
      .select('transfer_status')
      .order('transfer_status');

    if (statusError) {
      console.error('❌ Erro ao buscar valores de status:', statusError);
      return;
    }

    const uniqueStatuses = [...new Set(statusValues.map(item => item.transfer_status))];
    console.log('\n📋 Valores únicos em transfer_status:');
    uniqueStatuses.forEach(status => {
      const count = statusValues.filter(item => item.transfer_status === status).length;
      console.log(`   ${status}: ${count} registros`);
    });

    // 2. Verificar valores únicos em offer_status
    const { data: offerStatusValues, error: offerError } = await supabase
      .from('game_transfers')
      .select('offer_status')
      .not('offer_status', 'is', null);

    if (!offerError && offerStatusValues.length > 0) {
      const uniqueOfferStatuses = [...new Set(offerStatusValues.map(item => item.offer_status))];
      console.log('\n📋 Valores únicos em offer_status:');
      uniqueOfferStatuses.forEach(status => {
        const count = offerStatusValues.filter(item => item.offer_status === status).length;
        console.log(`   ${status}: ${count} registros`);
      });
    }

    // 3. Tentar inserir com diferentes valores de transfer_status
    console.log('\n🧪 Testando diferentes valores de transfer_status...');
    
    const testValues = ['listed', 'offer_made', 'accepted', 'rejected', 'completed'];
    
    for (const testValue of testValues) {
      try {
        const testData = {
          player_id: 'test-constraint-player',
          is_youth_player: true,
          selling_team_id: 'test-team-id',
          listing_price: 1000,
          transfer_status: testValue
        };

        const { error: insertError } = await supabase
          .from('game_transfers')
          .insert(testData);

        if (insertError) {
          console.log(`   ❌ ${testValue}: ${insertError.message}`);
          
          if (insertError.code === '23514') {
            console.log(`      🔒 Constraint violation para: ${testValue}`);
          }
        } else {
          console.log(`   ✅ ${testValue}: Inserção bem-sucedida`);
          
          // Limpar dados de teste
          await supabase
            .from('game_transfers')
            .delete()
            .eq('player_id', 'test-constraint-player');
        }
      } catch (error) {
        console.log(`   ❌ ${testValue}: ${error.message}`);
      }
    }

    // 4. Verificar se há constraints específicas
    console.log('\n🔒 Verificando constraints específicas...');
    
    // Tentar inserir com dados mínimos
    const minimalData = {
      player_id: 'minimal-test-player',
      is_youth_player: true,
      selling_team_id: 'minimal-team-id',
      listing_price: 1000
    };

    try {
      const { error: minimalError } = await supabase
        .from('game_transfers')
        .insert(minimalData);

      if (minimalError) {
        console.log('❌ Erro com dados mínimos:', minimalError.message);
        console.log('   Código:', minimalError.code);
        
        if (minimalError.details) {
          console.log('   Detalhes:', minimalError.details);
        }
      } else {
        console.log('✅ Inserção com dados mínimos funcionou');
        
        // Limpar
        await supabase
          .from('game_transfers')
          .delete()
          .eq('player_id', 'minimal-test-player');
      }
    } catch (error) {
      console.log('❌ Erro durante teste mínimo:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkConstraints()
  .then(() => {
    console.log('\n✅ Verificação de constraints concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
