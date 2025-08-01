const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testPlayerCreation() {
  try {
    console.log('🧪 TESTANDO CRIAÇÃO DE JOGADORES');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. VERIFICAR ESTRUTURA DA TABELA
    console.log('\n📋 1. Verificando estrutura da tabela youth_players...');
    
    try {
      const { data: samplePlayer, error: checkError } = await supabase
        .from('youth_players')
        .select('*')
        .limit(1);
      
      if (checkError) {
        console.log(`  ❌ Erro ao acessar tabela: ${checkError.message}`);
        return;
      }
      
      if (samplePlayer && samplePlayer.length > 0) {
        console.log('  ✅ Tabela acessível');
        console.log('  📋 Colunas disponíveis:', Object.keys(samplePlayer[0]));
      } else {
        console.log('  ✅ Tabela vazia, mas acessível');
      }
    } catch (err) {
      console.log(`  ❌ Tabela não encontrada: ${err.message}`);
      return;
    }
    
    // 2. BUSCAR UM TIME PARA TESTE
    console.log('\n👥 2. Buscando time para teste...');
    
    const { data: testTeam, error: teamError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('team_type', 'machine')
      .limit(1)
      .single();
    
    if (teamError || !testTeam) {
      console.log(`  ❌ Erro ao buscar time: ${teamError?.message}`);
      return;
    }
    
    console.log(`  ✅ Time encontrado: ${testTeam.name} (${testTeam.id})`);
    
    // 3. TESTAR CRIAÇÃO DE UM JOGADOR
    console.log('\n⚽ 3. Testando criação de jogador...');
    
    const testPlayer = {
      team_id: testTeam.id,
      name: 'João Silva',
      position: 'Goleiro',
      age: 20,
      pace: 60,
      shooting: 50,
      passing: 55,
      dribbling: 45,
      defending: 80,
      physical: 75,
      potential: 75,
      overall: 63,
      created_at: new Date().toISOString()
    };
    
    console.log('  📝 Dados do jogador:', testPlayer);
    
    const { data: newPlayer, error: createError } = await supabase
      .from('youth_players')
      .insert(testPlayer)
      .select()
      .single();
    
    if (createError) {
      console.log(`  ❌ Erro ao criar jogador: ${createError.message}`);
      console.log('  📋 Detalhes do erro:', createError);
      return;
    }
    
    console.log('  ✅ Jogador criado com sucesso!');
    console.log('  📊 Jogador criado:', newPlayer);
    
    // 4. VERIFICAR SE O JOGADOR FOI CRIADO
    console.log('\n🔍 4. Verificando jogador criado...');
    
    const { data: createdPlayer, error: fetchError } = await supabase
      .from('youth_players')
      .select('*')
      .eq('id', newPlayer.id)
      .single();
    
    if (fetchError) {
      console.log(`  ❌ Erro ao buscar jogador: ${fetchError.message}`);
    } else {
      console.log('  ✅ Jogador encontrado no banco');
      console.log('  📊 Dados:', createdPlayer);
    }
    
    // 5. CRIAR MAIS JOGADORES PARA O MESMO TIME
    console.log('\n👥 5. Criando mais jogadores...');
    
    const positions = ['Zagueiro', 'Lateral', 'Meia', 'Atacante'];
    let successCount = 0;
    
    for (let i = 0; i < 5; i++) {
      const position = positions[i % positions.length];
      const playerData = {
        team_id: testTeam.id,
        name: `Jogador ${i + 1}`,
        position: position,
        age: 18 + Math.floor(Math.random() * 5),
        pace: 50 + Math.floor(Math.random() * 30),
        shooting: 50 + Math.floor(Math.random() * 30),
        passing: 50 + Math.floor(Math.random() * 30),
        dribbling: 50 + Math.floor(Math.random() * 30),
        defending: 50 + Math.floor(Math.random() * 30),
        physical: 50 + Math.floor(Math.random() * 30),
        potential: 60 + Math.floor(Math.random() * 30),
        overall: Math.floor((50 + Math.floor(Math.random() * 30))),
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('youth_players')
        .insert(playerData);
      
      if (error) {
        console.log(`    ❌ Erro ao criar jogador ${i + 1}: ${error.message}`);
      } else {
        console.log(`    ✅ Jogador ${i + 1} criado`);
        successCount++;
      }
    }
    
    console.log(`\n📊 Resultado: ${successCount}/5 jogadores criados com sucesso`);
    
    // 6. VERIFICAR TOTAL DE JOGADORES DO TIME
    console.log('\n📋 6. Verificando total de jogadores do time...');
    
    const { data: allPlayers, error: countError } = await supabase
      .from('youth_players')
      .select('id')
      .eq('team_id', testTeam.id);
    
    if (countError) {
      console.log(`  ❌ Erro ao contar jogadores: ${countError.message}`);
    } else {
      console.log(`  📊 Total de jogadores do ${testTeam.name}: ${allPlayers.length}`);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testPlayerCreation(); 