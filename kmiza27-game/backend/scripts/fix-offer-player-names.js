const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function fixOfferPlayerNames() {
  console.log('🔧 CORRIGINDO NOMES DOS JOGADORES NAS OFERTAS');
  console.log('==============================================\n');
  
  const supabase = getSupabaseServiceClient('vps');
  
  try {
    // 1. Buscar todas as ofertas com player_name null
    console.log('📋 1. Buscando ofertas sem nome do jogador...');
    
    const { data: offersWithoutNames, error: offersError } = await supabase
      .from('game_transfers')
      .select('id, player_id, player_name, transfer_status')
      .or('player_name.is.null,player_name.eq.Sem nome')
      .order('created_at', { ascending: false });
    
    if (offersError) {
      console.log('❌ Erro ao buscar ofertas:', offersError.message);
      return;
    }
    
    console.log(`🔍 Encontradas ${offersWithoutNames?.length || 0} ofertas sem nome do jogador`);
    
    if (!offersWithoutNames || offersWithoutNames.length === 0) {
      console.log('✅ Todas as ofertas já têm nomes!');
      return;
    }
    
    // 2. Atualizar nomes dos jogadores
    console.log('\n🔄 2. Atualizando nomes dos jogadores...');
    
    let totalUpdated = 0;
    let totalErrors = 0;
    
    for (const offer of offersWithoutNames) {
      try {
        // Buscar nome do jogador
        const { data: player, error: playerError } = await supabase
          .from('game_players')
          .select('name')
          .eq('id', offer.player_id)
          .single();
        
        if (playerError || !player) {
          console.log(`   ❌ Jogador ${offer.player_id}: Não encontrado`);
          totalErrors++;
          continue;
        }
        
        // Atualizar nome na oferta
        const { error: updateError } = await supabase
          .from('game_transfers')
          .update({ player_name: player.name })
          .eq('id', offer.id);
        
        if (updateError) {
          console.log(`   ❌ ${player.name}: ${updateError.message}`);
          totalErrors++;
        } else {
          console.log(`   ✅ ${player.name}: Nome atualizado (${offer.transfer_status})`);
          totalUpdated++;
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao processar ${offer.id}: ${error.message}`);
        totalErrors++;
      }
    }
    
    // 3. Resumo final
    console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA!');
    console.log('==========================');
    console.log(`✅ ${totalUpdated} nomes atualizados`);
    console.log(`❌ ${totalErrors} erros`);
    
    // 4. Verificar resultado das contrapropostas
    console.log('\n📊 4. Verificando contrapropostas...');
    
    const { data: counterOffers, error: counterError } = await supabase
      .from('game_transfers')
      .select('player_name, counter_offer_price, transfer_status, ai_decision')
      .eq('transfer_status', 'negotiating')
      .eq('buying_team_id', '2ddad822-bc1b-4b3b-ad8d-2b733e153bf9');
    
    if (counterError) {
      console.log('❌ Erro ao verificar contrapropostas:', counterError.message);
    } else {
      console.log(`📋 Contrapropostas pendentes: ${counterOffers?.length || 0}`);
      
      if (counterOffers && counterOffers.length > 0) {
        console.log('\n🤖 CONTRAPROPOSTAS DA IA:');
        counterOffers.forEach((offer, index) => {
          console.log(`   ${index + 1}. ${offer.player_name || 'Sem nome'}: R$ ${offer.counter_offer_price?.toLocaleString() || 'N/A'} (${offer.ai_decision})`);
        });
      }
    }
    
    // 5. Recomendações para a interface
    console.log('\n💡 5. RECOMENDAÇÕES PARA A INTERFACE:');
    console.log('   • Buscar ofertas com transfer_status = "negotiating"');
    console.log('   • Mostrar player_name, counter_offer_price e ai_decision');
    console.log('   • Exibir botões "Aceitar" e "Recusar" contraproposta');
    console.log('   • Atualizar status para "accepted" ou "rejected"');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixOfferPlayerNames();
