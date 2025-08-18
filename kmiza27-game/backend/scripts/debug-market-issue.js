const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function debugMarketIssue() {
  console.log('🔍 DEBUGANDO PROBLEMA DO MERCADO');
  console.log('==================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar estrutura da tabela game_players
    console.log('📋 1. Verificando estrutura da tabela game_players...');
    
    const { data: samplePlayer, error: sampleError } = await supabase
      .from('game_players')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Erro ao buscar jogador de exemplo:', sampleError.message);
    } else if (samplePlayer && samplePlayer.length > 0) {
      console.log('✅ Estrutura da tabela game_players:');
      const player = samplePlayer[0];
      Object.keys(player).forEach(key => {
        console.log(`   • ${key}: ${typeof player[key]} = ${player[key]}`);
      });
    } else {
      console.log('⚠️ Tabela game_players está vazia');
    }

    // 2. Verificar todos os jogadores
    console.log('\n👥 2. Verificando todos os jogadores...');
    
    const { data: allPlayers, error: allPlayersError } = await supabase
      .from('game_players')
      .select('id, name, position, team_id, team_type');

    if (allPlayersError) {
      console.log('❌ Erro ao buscar todos os jogadores:', allPlayersError.message);
    } else {
      console.log(`📊 Total de jogadores: ${allPlayers?.length || 0}`);
      
      if (allPlayers && allPlayers.length > 0) {
        // Agrupar por team_type
        const playersByType = {};
        allPlayers.forEach(player => {
          const type = player.team_type || 'unknown';
          if (!playersByType[type]) playersByType[type] = [];
          playersByType[type].push(player);
        });

        Object.keys(playersByType).forEach(type => {
          console.log(`   • ${type}: ${playersByType[type].length} jogadores`);
        });

        // Mostrar alguns exemplos
        console.log('\n📋 Exemplos de jogadores:');
        allPlayers.slice(0, 5).forEach((player, index) => {
          console.log(`   ${index + 1}. ${player.name} (${player.position}) - Time: ${player.team_id} - Tipo: ${player.team_type || 'N/A'}`);
        });
      }
    }

    // 3. Verificar times
    console.log('\n🏟️ 3. Verificando times...');
    
    const { data: allTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type');

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
    } else {
      console.log(`📊 Total de times: ${allTeams?.length || 0}`);
      
      if (allTeams && allTeams.length > 0) {
        // Agrupar por team_type
        const teamsByType = {};
        allTeams.forEach(team => {
          const type = team.team_type || 'unknown';
          if (!teamsByType[type]) teamsByType[type] = [];
          teamsByType[type].push(team);
        });

        Object.keys(teamsByType).forEach(type => {
          console.log(`   • ${type}: ${teamsByType[type].length} times`);
        });
      }
    }

    // 4. Verificar se há jogadores sem team_type
    console.log('\n🔍 4. Verificando jogadores sem team_type...');
    
    if (allPlayers && allPlayers.length > 0) {
      const playersWithoutType = allPlayers.filter(p => !p.team_type);
      console.log(`⚠️ Jogadores sem team_type: ${playersWithoutType.length}`);
      
      if (playersWithoutType.length > 0) {
        console.log('📋 Exemplos:');
        playersWithoutType.slice(0, 3).forEach((player, index) => {
          console.log(`   ${index + 1}. ${player.name} (${player.position}) - Time ID: ${player.team_id}`);
        });
      }
    }

    // 5. Verificar se há jogadores com team_type incorreto
    console.log('\n🔍 5. Verificando team_type dos jogadores...');
    
    if (allPlayers && allPlayers.length > 0) {
      const machinePlayers = allPlayers.filter(p => p.team_type === 'machine');
      const userPlayers = allPlayers.filter(p => p.team_type === 'user_created');
      const otherPlayers = allPlayers.filter(p => p.team_type && p.team_type !== 'machine' && p.team_type !== 'user_created');
      
      console.log(`🤖 Jogadores machine: ${machinePlayers.length}`);
      console.log(`👤 Jogadores user_created: ${userPlayers.length}`);
      console.log(`❓ Outros tipos: ${otherPlayers.length}`);
      
      if (otherPlayers.length > 0) {
        console.log('📋 Tipos encontrados:');
        const types = [...new Set(otherPlayers.map(p => p.team_type))];
        types.forEach(type => {
          const count = otherPlayers.filter(p => p.team_type === type).length;
          console.log(`   • ${type}: ${count} jogadores`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugMarketIssue();
