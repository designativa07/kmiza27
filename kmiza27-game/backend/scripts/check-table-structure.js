const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela game_transfers...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Verificar se a tabela existe e suas colunas
    const { data: columns, error: columnsError } = await supabase
      .from('game_transfers')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.error('❌ Erro ao acessar tabela game_transfers:', columnsError);
      return;
    }

    console.log('✅ Tabela game_transfers acessível');

    // 2. Verificar uma listagem específica para ver a estrutura
    const { data: sampleListing, error: sampleError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('transfer_status', 'listed')
      .limit(1)
      .single();

    if (sampleError) {
      console.error('❌ Erro ao buscar amostra:', sampleError);
      return;
    }

    console.log('\n📋 Estrutura da tabela game_transfers:');
    console.log('Colunas disponíveis:');
    Object.keys(sampleListing).forEach(key => {
      console.log(`  - ${key}: ${typeof sampleListing[key]} (${sampleListing[key]})`);
    });

    // 3. Verificar se listing_price está presente
    if ('listing_price' in sampleListing) {
      console.log('\n✅ Coluna listing_price encontrada');
      console.log(`   Valor: ${sampleListing.listing_price}`);
    } else {
      console.log('\n❌ Coluna listing_price NÃO encontrada!');
    }

    // 4. Verificar constraints da tabela
    console.log('\n🔒 Verificando constraints...');
    
    // Tentar inserir uma linha de teste para ver as constraints
    const testData = {
      player_id: 'test-player-id',
      is_youth_player: true,
      selling_team_id: 'test-team-id',
      listing_price: 1000,
      transfer_status: 'test'
    };

    try {
      const { error: insertError } = await supabase
        .from('game_transfers')
        .insert(testData);

      if (insertError) {
        console.log('❌ Erro ao inserir dados de teste:', insertError.message);
        
        if (insertError.code === '23502') {
          console.log('   🔍 Erro de NOT NULL constraint detectado');
          console.log('   📝 Verifique se todas as colunas obrigatórias estão sendo preenchidas');
        }
      } else {
        console.log('✅ Inserção de teste bem-sucedida');
        
        // Limpar dados de teste
        await supabase
          .from('game_transfers')
          .delete()
          .eq('player_id', 'test-player-id');
        console.log('🧹 Dados de teste removidos');
      }
    } catch (error) {
      console.log('❌ Erro durante teste de inserção:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkTableStructure()
  .then(() => {
    console.log('\n✅ Verificação concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
