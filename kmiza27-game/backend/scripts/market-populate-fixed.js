const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function marketPopulateFixed() {
  console.log('🚀 POPULANDO MERCADO - VERSÃO CORRIGIDA');
  console.log('==========================================\n');
  
  const supabase = getSupabaseServiceClient('vps');
  
  try {
    // 1. Buscar jogadores da máquina
    console.log('🔍 1. Buscando jogadores da máquina...');
    
    const { data: machinePlayers, error: playersError } = await supabase
      .from('game_players')
      .select('id, name, team_id, position')
      .eq('team_type', 'machine')
      .limit(20); // Limitar a 20 jogadores para teste
    
    if (playersError) {
      console.log('❌ Erro ao buscar jogadores:', playersError.message);
      return;
    }
    
    console.log(`👥 Encontrados ${machinePlayers?.length || 0} jogadores da máquina`);
    
    if (!machinePlayers || machinePlayers.length === 0) {
      console.log('❌ Nenhum jogador da máquina encontrado');
      return;
    }
    
    // 2. Criar listagens no mercado
    console.log('\n📝 2. Criando listagens no mercado...');
    
    let totalCreated = 0;
    let totalErrors = 0;
    
    for (const player of machinePlayers) {
      try {
        // Calcular preço baseado na posição
        const basePrice = 50000;
        const positionMultiplier = {
          'GK': 1.2,
          'CB': 1.1,
          'LB': 1.0,
          'RB': 1.0,
          'DM': 1.3,
          'CM': 1.4,
          'AM': 1.5,
          'ST': 1.6
        };
        
        const multiplier = positionMultiplier[player.position] || 1.0;
        const listingPrice = Math.floor(basePrice * multiplier);
        
        // IMPORTANTE: Usar 'pending' como offer_status (valor válido!)
        const listing = {
          player_id: player.id,
          is_youth_player: false,
          selling_team_id: player.team_id,
          listing_price: listingPrice,
          listed_at: new Date().toISOString(),
          transfer_status: 'listed',
          offer_status: 'pending', // ✅ VALOR CORRETO!
          is_ai_team: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('game_transfers')
          .insert(listing);
        
        if (insertError) {
          console.log(`   ❌ ${player.name} (${player.position}): ${insertError.message}`);
          totalErrors++;
        } else {
          console.log(`   ✅ ${player.name} (${player.position}): R$ ${listingPrice.toLocaleString()}`);
          totalCreated++;
        }
        
      } catch (error) {
        console.log(`   ❌ ${player.name}: ${error.message}`);
        totalErrors++;
      }
    }
    
    // 3. Resumo final
    console.log('\n🎉 RESUMO FINAL:');
    console.log('================');
    console.log(`✅ ${totalCreated} jogadores listados com sucesso`);
    console.log(`❌ ${totalErrors} erros`);
    console.log(`📊 Total de listagens criadas: ${totalCreated}`);
    
    // 4. Verificar resultado
    if (totalCreated > 0) {
      console.log('\n📊 4. Verificando resultado...');
      
      const { data: allListings, error: listingsError } = await supabase
        .from('game_transfers')
        .select('player_name, listing_price, transfer_status, offer_status')
        .eq('transfer_status', 'listed');
      
      if (listingsError) {
        console.log('❌ Erro ao verificar listagens:', listingsError.message);
      } else {
        console.log(`📋 Total de listagens no mercado: ${allListings?.length || 0}`);
        
        if (allListings && allListings.length > 0) {
          console.log('\n🏷️ EXEMPLOS DE LISTAGENS:');
          allListings.slice(0, 5).forEach((listing, index) => {
            console.log(`   ${index + 1}. ${listing.player_name || 'Sem nome'}: R$ ${listing.listing_price?.toLocaleString() || 'N/A'} (${listing.offer_status})`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

marketPopulateFixed();
