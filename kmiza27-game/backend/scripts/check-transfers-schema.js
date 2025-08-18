const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function checkTransfersSchema() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA GAME_TRANSFERS');
  console.log('==================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar estrutura da tabela game_transfers
    console.log('📋 1. Verificando estrutura da tabela game_transfers...');
    
    const { data: sampleTransfer, error: sampleError } = await supabase
      .from('game_transfers')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Erro ao buscar transfer de exemplo:', sampleError.message);
    } else if (sampleTransfer && sampleTransfer.length > 0) {
      console.log('✅ Estrutura da tabela game_transfers:');
      const transfer = sampleTransfer[0];
      Object.keys(transfer).forEach(key => {
        console.log(`   • ${key}: ${typeof transfer[key]} = ${transfer[key]}`);
      });
    } else {
      console.log('⚠️ Tabela game_transfers está vazia');
    }

    // 2. Verificar se há alguma listagem existente
    console.log('\n📊 2. Verificando listagens existentes...');
    
    const { data: existingListings, error: listingsError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('transfer_status', 'listed');

    if (listingsError) {
      console.log('❌ Erro ao buscar listagens:', listingsError.message);
    } else {
      console.log(`📋 Listagens existentes: ${existingListings?.length || 0}`);
      
      if (existingListings && existingListings.length > 0) {
        console.log('📋 Exemplo de listagem:');
        const listing = existingListings[0];
        Object.keys(listing).forEach(key => {
          console.log(`   • ${key}: ${listing[key]}`);
        });
      }
    }

    // 3. Verificar se há relacionamento com game_players
    console.log('\n🔗 3. Verificando relacionamento com game_players...');
    
    if (existingListings && existingListings.length > 0) {
      const listing = existingListings[0];
      
      if (listing.player_id) {
        console.log(`📋 Listagem tem player_id: ${listing.player_id}`);
        
        // Buscar informações do jogador
        const { data: player, error: playerError } = await supabase
          .from('game_players')
          .select('name, position, team_id')
          .eq('id', listing.player_id)
          .limit(1);

        if (!playerError && player && player.length > 0) {
          console.log('📋 Informações do jogador:');
          const p = player[0];
          console.log(`   • Nome: ${p.name}`);
          console.log(`   • Posição: ${p.position}`);
          console.log(`   • Time ID: ${p.team_id}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTransfersSchema();
