const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function fixMachineTeamNames() {
  try {
    console.log('🔧 Corrigindo nomes dos times da máquina...');
    const supabase = getSupabaseServiceClient('vps');

    // Get all machine team stats for the promoted user in Série C
    const { data: machineStats, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', '22fa9e4b-858e-49b5-b80c-1390f9665ac9')
      .eq('tier', 3)
      .eq('season_year', 2026);

    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas da máquina:', statsError.message);
      return;
    }

    console.log(`📊 Encontradas ${machineStats.length} estatísticas da máquina para corrigir`);

    // Get all machine teams in Série C
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('*')
      .eq('tier', 3);

    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }

    console.log(`🏟️ Encontrados ${machineTeams.length} times da máquina na Série C`);

    // Create a map of team_id to team_name
    const teamNameMap = {};
    machineTeams.forEach(team => {
      teamNameMap[team.id] = team.name;
    });

    // Update each machine stat with the correct team name
    let updatedCount = 0;
    for (const stat of machineStats) {
      const teamName = teamNameMap[stat.team_id];
      if (teamName && stat.team_name !== teamName) {
        console.log(`   🔄 Atualizando: ${stat.team_name || 'undefined'} → ${teamName}`);
        
        const { error: updateError } = await supabase
          .from('game_user_machine_team_stats')
          .update({ team_name: teamName })
          .eq('id', stat.id);

        if (updateError) {
          console.log(`   ❌ Erro ao atualizar ${stat.id}:`, updateError.message);
        } else {
          updatedCount++;
        }
      } else if (!teamName) {
        console.log(`   ⚠️ Time não encontrado para ID: ${stat.team_id}`);
      }
    }

    console.log(`\n✅ Atualizados ${updatedCount} registros com nomes corretos`);

    // Verify the fix
    console.log('\n🔍 Verificando correção...');
    const { data: fixedStats, error: verifyError } = await supabase
      .from('game_user_machine_team_stats')
      .select('team_name, points, games_played')
      .eq('user_id', '22fa9e4b-858e-49b5-b80c-1390f9665ac9')
      .eq('tier', 3)
      .eq('season_year', 2026)
      .order('team_name');

    if (verifyError) {
      console.log('❌ Erro ao verificar correção:', verifyError.message);
      return;
    }

    console.log('📊 Estatísticas corrigidas:');
    fixedStats.forEach(stat => {
      console.log(`   - ${stat.team_name}: ${stat.points} pts, ${stat.games_played} jogos`);
    });

    console.log('\n✅ Correção dos nomes dos times da máquina concluída');
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

fixMachineTeamNames(); 