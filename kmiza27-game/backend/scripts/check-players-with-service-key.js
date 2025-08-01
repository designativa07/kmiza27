const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function checkPlayersWithServiceKey() {
  try {
    console.log('🔍 Verificando jogadores com service key...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    // Verificar jogadores do time mais recente
    const teamId = '6023c993-6cb7-41c9-b47a-44bc77455986';
    
    console.log(`📋 Verificando jogadores do time: ${teamId}`);
    
    const { data: players, error: playersError } = await supabase
      .from('youth_players')
      .select('*')
      .eq('team_id', teamId)
      .order('position', { ascending: true });

    if (playersError) {
      console.error('❌ Erro ao buscar jogadores:', playersError);
      return;
    }

    console.log(`✅ ${players.length} jogadores encontrados!`);

    // Mostrar estatísticas
    const positions = {};
    players.forEach(player => {
      positions[player.position] = (positions[player.position] || 0) + 1;
    });

    console.log('\n📊 Distribuição por posição:');
    Object.entries(positions).forEach(([position, count]) => {
      console.log(`  ${position}: ${count} jogadores`);
    });

    // Mostrar alguns jogadores como exemplo
    console.log('\n👥 Exemplos de jogadores:');
    players.slice(0, 5).forEach(player => {
      console.log(`  ${player.name} - ${player.position} (${player.attributes.pace}/${player.attributes.shooting}/${player.attributes.passing}/${player.attributes.dribbling}/${player.attributes.defending}/${player.attributes.physical})`);
    });

    // Verificar se tem exatamente 23 jogadores
    if (players.length === 23) {
      console.log('\n🎉 SUCESSO! Time criado com 23 jogadores!');
    } else {
      console.log(`\n⚠️ ATENÇÃO: Time criado com apenas ${players.length} jogadores (esperado: 23)`);
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

checkPlayersWithServiceKey().then(() => process.exit(0)).catch(() => process.exit(1)); 