const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAtleticoBrasiliense() {
  try {
    console.log('🔍 Investigando Atlético Brasiliense...\n');

    // 1. Buscar o time Atlético Brasiliense
    const { data: atleticoTeam, error: teamError } = await supabase
      .from('game_machine_teams')
      .select('*')
      .eq('name', 'Atlético Brasiliense')
      .single();

    if (teamError) {
      console.log('❌ Erro ao buscar Atlético Brasiliense:', teamError.message);
      return;
    }

    console.log(`✅ Time encontrado: ${atleticoTeam.name} (ID: ${atleticoTeam.id})`);

    // 2. Buscar usuário PALHOCA
    const { data: user, error: userError } = await supabase
      .from('game_users')
      .select('*')
      .eq('username', 'PALHOCA')
      .single();

    if (userError) {
      console.log('❌ Erro ao buscar usuário PALHOCA:', userError.message);
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.username} (ID: ${user.id})`);

    // 3. Verificar progresso do usuário
    const { data: progress, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('season_status', 'active')
      .single();

    if (progressError) {
      console.log('❌ Erro ao buscar progresso:', progressError.message);
      return;
    }

    console.log(`✅ Progresso encontrado: Série ${progress.current_tier}, Temporada ${progress.season_year}`);
    console.log(`   Jogos do usuário: ${progress.games_played}`);

    // 4. Verificar estatísticas do Atlético Brasiliense para este usuário
    const { data: atleticoStats, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('team_id', atleticoTeam.id)
      .eq('season_year', progress.season_year)
      .eq('tier', progress.current_tier)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.log('❌ Erro ao buscar estatísticas:', statsError.message);
      return;
    }

    if (atleticoStats) {
      console.log(`\n📊 Estatísticas do Atlético Brasiliense para ${user.username}:`);
      console.log(`   Jogos: ${atleticoStats.games_played}`);
      console.log(`   Vitórias: ${atleticoStats.wins}`);
      console.log(`   Empates: ${atleticoStats.draws}`);
      console.log(`   Derrotas: ${atleticoStats.losses}`);
      console.log(`   Pontos: ${atleticoStats.points}`);
      console.log(`   Gols pró: ${atleticoStats.goals_for}`);
      console.log(`   Gols contra: ${atleticoStats.goals_against}`);
      console.log(`   Última atualização: ${atleticoStats.updated_at}`);
    } else {
      console.log(`\n⚠️ Nenhuma estatística encontrada para Atlético Brasiliense`);
    }

    // 5. Verificar partidas do usuário contra Atlético Brasiliense
    const { data: userMatches, error: matchesError } = await supabase
      .from('game_season_matches')
      .select(`
        *,
        home_team:game_teams!home_team_id(id, name),
        away_team:game_teams!away_team_id(id, name),
        home_machine:game_machine_teams!home_machine_team_id(id, name),
        away_machine:game_machine_teams!away_machine_team_id(id, name)
      `)
      .eq('season_year', progress.season_year)
      .eq('tier', progress.current_tier)
      .or(`home_machine_team_id.eq.${atleticoTeam.id},away_machine_team_id.eq.${atleticoTeam.id}`)
      .eq('status', 'finished');

    if (matchesError) {
      console.log('❌ Erro ao buscar partidas:', matchesError.message);
      return;
    }

    console.log(`\n⚽ Partidas do usuário contra Atlético Brasiliense:`);
    if (userMatches && userMatches.length > 0) {
      userMatches.forEach((match, index) => {
        const isUserHome = match.home_team_id !== null;
        const userTeam = isUserHome ? match.home_team : match.away_team;
        const atleticoIsHome = match.home_machine_team_id === atleticoTeam.id;
        const atleticoTeamData = atleticoIsHome ? match.home_machine : match.away_machine;
        
        console.log(`   ${index + 1}. ${userTeam?.name || 'Usuário'} ${match.home_score} x ${match.away_score} ${atleticoTeamData?.name || 'Atlético'}`);
        console.log(`      Rodada: ${match.round_number}, Data: ${match.created_at}`);
      });
    } else {
      console.log('   Nenhuma partida encontrada');
    }

    // 6. Verificar se há partidas entre times da máquina registradas
    const { data: machineMatches, error: machineMatchesError } = await supabase
      .from('game_season_matches')
      .select('*')
      .eq('season_year', progress.season_year)
      .eq('tier', progress.current_tier)
      .is('home_team_id', null)
      .is('away_team_id', null)
      .eq('status', 'finished');

    if (machineMatchesError) {
      console.log('❌ Erro ao buscar partidas entre times da máquina:', machineMatchesError.message);
      return;
    }

    console.log(`\n🤖 Partidas entre times da máquina registradas:`);
    if (machineMatches && machineMatches.length > 0) {
      console.log(`   Total: ${machineMatches.length} partidas`);
      machineMatches.slice(0, 5).forEach((match, index) => {
        console.log(`   ${index + 1}. Rodada ${match.round_number}, ${match.home_score} x ${match.away_score}`);
      });
      if (machineMatches.length > 5) {
        console.log(`   ... e mais ${machineMatches.length - 5} partidas`);
      }
    } else {
      console.log('   Nenhuma partida entre times da máquina registrada');
    }

    // 7. Verificar todas as estatísticas de times da máquina para este usuário
    const { data: allMachineStats, error: allStatsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('season_year', progress.season_year)
      .eq('tier', progress.current_tier)
      .order('games_played', { ascending: false });

    if (allStatsError) {
      console.log('❌ Erro ao buscar todas as estatísticas:', allStatsError.message);
      return;
    }

    console.log(`\n📈 Estatísticas de todos os times da máquina para ${user.username}:`);
    if (allMachineStats && allMachineStats.length > 0) {
      allMachineStats.forEach((stat, index) => {
        console.log(`   ${index + 1}. ${stat.team_id === atleticoTeam.id ? '🔴 ' : ''}${stat.team_id}: ${stat.games_played} jogos, ${stat.points} pontos`);
      });
    } else {
      console.log('   Nenhuma estatística encontrada');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugAtleticoBrasiliense();
