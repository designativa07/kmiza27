const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function checkPlayerCounts() {
  console.log('🔍 VERIFICANDO CONTAGEM DE JOGADORES POR TIME');
  console.log('==============================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // Buscar todos os jogadores com seus times
    const { data: players, error } = await supabase
      .from('game_players')
      .select(`
        id,
        name,
        position,
        team:game_teams!game_players_team_id_fkey(
          id,
          name,
          team_type
        )
      `);

    if (error) {
      console.log('❌ Erro ao buscar jogadores:', error.message);
      return;
    }

    // Contar jogadores por time
    const teamCounts = {};
    players?.forEach(player => {
      const teamName = player.team?.name || 'Time não encontrado';
      teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
    });

    console.log('📊 JOGADORES POR TIME:');
    console.log('=======================');
    
    Object.entries(teamCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([teamName, count]) => {
        console.log(`   • ${teamName}: ${count} jogadores`);
      });

    console.log(`\n📈 TOTAL: ${players?.length || 0} jogadores em ${Object.keys(teamCounts).length} times`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkPlayerCounts();
