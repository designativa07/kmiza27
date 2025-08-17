const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function debugMakeOffer() {
  try {
    console.log('🔍 Debug do método makeOffer...');

    const supabase = getSupabaseServiceClient('vps');

    // 1. Simular os dados exatos que o frontend enviaria
    const frontendData = {
      playerId: 'e79ec7f7-ad78-4b4d-bf08-1366e9244532',
      buyingTeamId: 'af6fcd3f-2a6c-4c99-8be6-0d797755ac61',
      offerPrice: 4842,
      isYouth: true
    };

    console.log('📋 Dados do frontend:');
    console.log(JSON.stringify(frontendData, null, 2));

    // 2. PASSO 1: Verificar se o jogador ainda está listado
    console.log('\n🔍 PASSO 1: Verificando listagens do jogador...');
    const { data: transfers, error: fetchError } = await supabase
      .from('game_transfers')
      .select('*')
      .eq('player_id', frontendData.playerId)
      .eq('is_youth_player', frontendData.isYouth)
      .eq('transfer_status', 'listed');

    if (fetchError) {
      console.error('❌ Erro ao buscar listagens:', fetchError);
      return;
    }

    if (!transfers || transfers.length === 0) {
      console.error('❌ Nenhuma listagem encontrada para o jogador');
      return;
    }

    console.log(`✅ Encontradas ${transfers.length} listagens para o jogador`);
    transfers.forEach((transfer, index) => {
      console.log(`   ${index + 1}. ID: ${transfer.id}, Preço: R$ ${transfer.listing_price}, Time: ${transfer.selling_team_id}`);
    });

    // 3. PASSO 2: Verificar se não é o próprio time fazendo oferta
    console.log('\n🔍 PASSO 2: Verificando se não é o próprio time...');
    const transfer = transfers[0];
    if (transfer.selling_team_id === frontendData.buyingTeamId) {
      console.error('❌ Não pode fazer oferta pelo próprio jogador');
      return;
    }
    console.log('✅ Não é o próprio time');

    // 4. PASSO 3: Verificar se já existe uma oferta deste time
    console.log('\n🔍 PASSO 3: Verificando ofertas existentes...');
    const { data: existingOffer, error: checkError } = await supabase
      .from('game_transfers')
      .select('id')
      .eq('player_id', frontendData.playerId)
      .eq('buying_team_id', frontendData.buyingTeamId)
      .not('offer_price', 'is', null);

    if (checkError) {
      console.error('❌ Erro ao verificar ofertas existentes:', checkError);
      return;
    }

    if (existingOffer && existingOffer.length > 0) {
      console.log('⚠️  Já existe uma oferta deste time para este jogador');
      return;
    }
    console.log('✅ Nenhuma oferta existente encontrada');

    // 5. PASSO 4: Buscar nome do time comprador
    console.log('\n🔍 PASSO 4: Buscando informações do time comprador...');
    const { data: buyingTeam, error: teamError } = await supabase
      .from('game_teams')
      .select('name')
      .eq('id', frontendData.buyingTeamId)
      .single();

    if (teamError || !buyingTeam) {
      console.error('❌ Erro ao buscar informações do time:', teamError);
      return;
    }
    console.log(`✅ Time comprador: ${buyingTeam.name}`);

    // 6. PASSO 5: Buscar nome do jogador
    console.log('\n🔍 PASSO 5: Buscando informações do jogador...');
    const playerTable = frontendData.isYouth ? 'youth_players' : 'game_players';
    const { data: player, error: playerError } = await supabase
      .from(playerTable)
      .select('name')
      .eq('id', frontendData.playerId)
      .single();

    if (playerError || !player) {
      console.error('❌ Erro ao buscar informações do jogador:', playerError);
      return;
    }
    console.log(`✅ Jogador: ${player.name}`);

    // 7. PASSO 6: Criar nova oferta
    console.log('\n🔍 PASSO 6: Criando nova oferta...');
    
    const offerData = {
      player_id: frontendData.playerId,
      is_youth_player: frontendData.isYouth,
      selling_team_id: transfer.selling_team_id,
      buying_team_id: frontendData.buyingTeamId,
      listing_price: transfer.listing_price,
      offer_price: frontendData.offerPrice,
      offer_status: 'pending',
      transfer_status: 'listed',
      offer_made_at: new Date().toISOString(),
      listed_at: transfer.listed_at,
    };

    console.log('📋 Dados da oferta:');
    Object.entries(offerData).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    const { data: newOffer, error: insertError } = await supabase
      .from('game_transfers')
      .insert(offerData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar oferta:', insertError);
      console.error('   Código:', insertError.code);
      console.error('   Mensagem:', insertError.message);
      
      if (insertError.details) {
        console.error('   Detalhes:', insertError.details);
      }
      
      if (insertError.hint) {
        console.error('   Dica:', insertError.hint);
      }
      return;
    }

    console.log('✅ Oferta criada com sucesso!');
    console.log(`   ID: ${newOffer.id}`);
    console.log(`   Preço: R$ ${newOffer.offer_price}`);

    // 8. PASSO 7: Criar notificação (simular)
    console.log('\n🔍 PASSO 7: Simulando criação de notificação...');
    console.log('✅ Notificação seria criada aqui');

    // Limpar a oferta de teste
    const { error: deleteError } = await supabase
      .from('game_transfers')
      .delete()
      .eq('id', newOffer.id);

    if (deleteError) {
      console.error('⚠️  Erro ao limpar oferta de teste:', deleteError);
    } else {
      console.log('🧹 Oferta de teste removida');
    }

    console.log('\n🎉 Debug concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
    console.error('   Stack:', error.stack);
  }
}

// Executar debug
debugMakeOffer()
  .then(() => {
    console.log('\n✅ Debug concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
