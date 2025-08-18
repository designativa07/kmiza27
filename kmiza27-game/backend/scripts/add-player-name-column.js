const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function addPlayerNameColumn() {
  console.log('🔧 ADICIONANDO COLUNA PLAYER_NAME NA TABELA GAME_TRANSFERS');
  console.log('==========================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar se a coluna já existe
    console.log('🔍 1. Verificando se a coluna player_name já existe...');
    
    const { data: sampleTransfer, error: sampleError } = await supabase
      .from('game_transfers')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Erro ao verificar tabela:', sampleError.message);
      return;
    }

    if (sampleTransfer && sampleTransfer.length > 0) {
      const transfer = sampleTransfer[0];
      const hasPlayerName = 'player_name' in transfer;
      
      if (hasPlayerName) {
        console.log('✅ Coluna player_name já existe!');
        console.log('📋 Valor atual:', transfer.player_name);
      } else {
        console.log('❌ Coluna player_name NÃO existe');
      }
    }

    // 2. Tentar adicionar a coluna via RPC (se existir função)
    console.log('\n🔧 2. Tentando adicionar coluna via RPC...');
    
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('add_column_if_not_exists', {
          table_name: 'game_transfers',
          column_name: 'player_name',
          column_type: 'VARCHAR(255)'
        });

      if (rpcError) {
        console.log('ℹ️ RPC não disponível, tentando método alternativo...');
      } else {
        console.log('✅ Coluna adicionada via RPC!');
      }
    } catch (error) {
      console.log('ℹ️ RPC não disponível, tentando método alternativo...');
    }

    // 3. Método alternativo: atualizar listagens existentes com nomes
    console.log('\n🔄 3. Atualizando listagens existentes com nomes dos jogadores...');
    
    const { data: existingListings, error: listingsError } = await supabase
      .from('game_transfers')
      .select('id, player_id, transfer_status')
      .eq('transfer_status', 'listed');

    if (listingsError) {
      console.log('❌ Erro ao buscar listagens:', listingsError.message);
      return;
    }

    console.log(`📋 Encontradas ${existingListings?.length || 0} listagens para atualizar`);

    if (existingListings && existingListings.length > 0) {
      let updatedCount = 0;
      let errorCount = 0;

      for (const listing of existingListings) {
        if (listing.player_id) {
          // Buscar nome do jogador
          const { data: player, error: playerError } = await supabase
            .from('game_players')
            .select('name')
            .eq('id', listing.player_id)
            .limit(1);

          if (!playerError && player && player.length > 0) {
            const playerName = player[0].name;
            
            // Tentar atualizar com player_name
            try {
              const { error: updateError } = await supabase
                .from('game_transfers')
                .update({ player_name: playerName })
                .eq('id', listing.id);

              if (updateError) {
                console.log(`   ❌ Erro ao atualizar ${listing.id}: ${updateError.message}`);
                errorCount++;
              } else {
                console.log(`   ✅ ${listing.id}: ${playerName}`);
                updatedCount++;
              }
            } catch (error) {
              console.log(`   ❌ Erro geral ao atualizar ${listing.id}: ${error.message}`);
              errorCount++;
            }
          }
        }
      }

      console.log(`\n📊 Resumo da atualização:`);
      console.log(`   ✅ ${updatedCount} listagens atualizadas`);
      console.log(`   ❌ ${errorCount} erros`);
    }

    // 4. Verificar resultado final
    console.log('\n📊 4. Verificando resultado final...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('game_transfers')
      .select('id, player_id, player_name, transfer_status')
      .eq('transfer_status', 'listed')
      .limit(5);

    if (!finalError && finalCheck) {
      console.log('📋 Exemplos de listagens:');
      finalCheck.forEach((listing, index) => {
        console.log(`   ${index + 1}. ID: ${listing.id} - Player: ${listing.player_name || 'N/A'} (${listing.player_id})`);
      });
    }

    // 5. Resumo e recomendações
    console.log('\n💡 RESUMO E RECOMENDAÇÕES:');
    console.log('================================');
    console.log('✅ Tentativa de adicionar coluna player_name concluída');
    console.log('✅ Listagens existentes foram atualizadas com nomes');
    console.log('');
    console.log('🔄 PRÓXIMOS PASSOS:');
    console.log('====================');
    console.log('1. Se a coluna foi criada, execute o script de popular mercado');
    console.log('2. Se não foi criada, precisamos criar via SQL direto');
    console.log('3. O mercado deve mostrar nomes dos jogadores!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

addPlayerNameColumn();
