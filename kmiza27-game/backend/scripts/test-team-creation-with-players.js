const { getSupabaseClient } = require('../config/supabase-connection');

async function testTeamCreationWithPlayers() {
  try {
    console.log('🧪 Testando criação de time com jogadores...');
    
    // 1. Criar um time via API
    console.log('📋 Criando time via API...');
    const response = await fetch('http://localhost:3004/api/v1/game-teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Time Teste Jogadores',
        short_name: 'TTJ',
        stadium_name: 'Estádio Teste',
        colors: {
          primary: '#FF0000',
          secondary: '#0000FF'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na criação do time:', errorText);
      return;
    }

    const teamData = await response.json();
    console.log('✅ Time criado:', teamData.data.name);
    console.log('🆔 ID do time:', teamData.data.id);

    // 2. Aguardar um pouco para garantir que os jogadores foram criados
    console.log('⏳ Aguardando criação dos jogadores...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Verificar jogadores criados
    console.log('📋 Verificando jogadores...');
    const supabase = getSupabaseClient('vps');
    
    const { data: players, error: playersError } = await supabase
      .from('youth_players')
      .select('*')
      .eq('team_id', teamData.data.id)
      .order('position', { ascending: true });

    if (playersError) {
      console.error('❌ Erro ao buscar jogadores:', playersError);
      return;
    }

    console.log(`✅ ${players.length} jogadores encontrados!`);

    // 4. Mostrar estatísticas
    const positions = {};
    players.forEach(player => {
      positions[player.position] = (positions[player.position] || 0) + 1;
    });

    console.log('\n📊 Distribuição por posição:');
    Object.entries(positions).forEach(([position, count]) => {
      console.log(`  ${position}: ${count} jogadores`);
    });

    // 5. Verificar se tem exatamente 23 jogadores
    if (players.length === 23) {
      console.log('\n🎉 SUCESSO! Time criado com 23 jogadores!');
    } else {
      console.log(`\n⚠️ ATENÇÃO: Time criado com apenas ${players.length} jogadores (esperado: 23)`);
    }

    // 6. Mostrar alguns jogadores como exemplo
    console.log('\n👥 Exemplos de jogadores:');
    players.slice(0, 5).forEach(player => {
      console.log(`  ${player.name} - ${player.position} (${player.attributes.pace}/${player.attributes.shooting}/${player.attributes.passing}/${player.attributes.dribbling}/${player.attributes.defending}/${player.attributes.physical})`);
    });

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testTeamCreationWithPlayers().then(() => process.exit(0)).catch(() => process.exit(1)); 