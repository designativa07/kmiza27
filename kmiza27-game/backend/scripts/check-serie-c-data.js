const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function checkSerieCData() {
  try {
    console.log('🔍 Verificando dados da Série C...');
    const supabase = getSupabaseServiceClient('vps');

    // Check promoted user's current state
    const { data: promotedUser, error: userError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', '22fa9e4b-858e-49b5-b80c-1390f9665ac9')
      .eq('season_year', 2026)
      .single();

    if (userError) {
      console.log('❌ Erro ao buscar usuário promovido:', userError.message);
      return;
    }

    console.log('\n👤 Usuário promovido:');
    console.log(`   Série atual: ${promotedUser.current_tier} (${getTierName(promotedUser.current_tier)})`);
    console.log(`   Temporada: ${promotedUser.season_year}`);
    console.log(`   Status: ${promotedUser.season_status}`);
    console.log(`   Pontos: ${promotedUser.points}`);
    console.log(`   Jogos: ${promotedUser.games_played}`);

    // Check machine teams in Série C
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('*')
      .eq('tier', 3)
      .order('name');

    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }

    console.log(`\n🏟️ Times da máquina na Série C (${machineTeams.length}):`);
    machineTeams.forEach(team => {
      console.log(`   - ${team.name} (ID: ${team.id})`);
    });

    // Check machine team stats for the promoted user in Série C
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

    console.log(`\n📊 Estatísticas da máquina para o usuário na Série C (${machineStats.length}):`);
    machineStats.forEach(stat => {
      console.log(`   - ${stat.team_name}: ${stat.points} pts, ${stat.games_played} jogos`);
    });

    // Check season matches for the promoted user
    const { data: matches, error: matchesError } = await supabase
      .from('game_season_matches')
      .select('*')
      .eq('user_id', '22fa9e4b-858e-49b5-b80c-1390f9665ac9')
      .eq('season_year', 2026)
      .order('round_number', { ascending: true });

    if (matchesError) {
      console.log('❌ Erro ao buscar partidas:', matchesError.message);
      return;
    }

    console.log(`\n⚽ Partidas da temporada 2026 (${matches.length}):`);
    const totalMatches = matches.length;
    const finishedMatches = matches.filter(m => m.status === 'finished').length;
    console.log(`   Total: ${totalMatches} partidas`);
    console.log(`   Finalizadas: ${finishedMatches} partidas`);
    console.log(`   Pendentes: ${totalMatches - finishedMatches} partidas`);

    // Check if there are any matches with the user's team
    const userMatches = matches.filter(m => 
      m.home_team_id === promotedUser.team_id || m.away_team_id === promotedUser.team_id
    );
    console.log(`   Partidas do usuário: ${userMatches.length}`);

    // Check if there are machine vs machine matches
    const machineVsMachine = matches.filter(m => 
      m.home_team_id !== promotedUser.team_id && m.away_team_id !== promotedUser.team_id
    );
    console.log(`   Partidas máquina vs máquina: ${machineVsMachine.length}`);

    // Check if the user's team exists
    const { data: userTeam, error: teamError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('id', promotedUser.team_id)
      .single();

    if (teamError) {
      console.log('❌ Erro ao buscar time do usuário:', teamError.message);
    } else {
      console.log(`\n👕 Time do usuário: ${userTeam.name} (ID: ${userTeam.id})`);
    }

    // Check if there are any issues with the data
    console.log('\n🔍 Análise de problemas:');
    
    if (machineTeams.length === 0) {
      console.log('   ❌ PROBLEMA: Não há times da máquina na Série C');
    } else {
      console.log('   ✅ Times da máquina na Série C: OK');
    }

    if (machineStats.length === 0) {
      console.log('   ❌ PROBLEMA: Não há estatísticas da máquina para o usuário na Série C');
    } else if (machineStats.length !== machineTeams.length) {
      console.log(`   ⚠️ PROBLEMA: Estatísticas da máquina incompletas (${machineStats.length}/${machineTeams.length})`);
    } else {
      console.log('   ✅ Estatísticas da máquina na Série C: OK');
    }

    if (matches.length === 0) {
      console.log('   ❌ PROBLEMA: Não há partidas para a temporada 2026');
    } else if (matches.length < 38) {
      console.log(`   ⚠️ PROBLEMA: Calendário incompleto (${matches.length}/38 partidas esperadas)`);
    } else {
      console.log('   ✅ Calendário da temporada: OK');
    }

    if (userMatches.length === 0) {
      console.log('   ❌ PROBLEMA: O usuário não tem partidas agendadas');
    } else {
      console.log('   ✅ Partidas do usuário: OK');
    }

    console.log('\n✅ Verificação dos dados da Série C concluída');
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || 'Desconhecida';
}

checkSerieCData(); 