const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function testMachineTeamUpdate() {
  try {
    console.log('🧪 Testando atualização do time da máquina adversário...\n');

    // 1. Buscar usuário do time PALHOCA
    const { data: user, error: userError } = await supabase
      .from('game_users')
      .select('*')
      .eq('id', 'd10508e9-ca2a-4567-b2a6-812c800d8200')
      .single();

    if (userError) {
      console.log('❌ Erro ao buscar usuário PALHOCA:', userError.message);
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.username} (ID: ${user.id})`);

    // 2. Buscar progresso ativo
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

    // 3. Buscar todas as partidas do usuário contra times da máquina
    const { data: userMatches, error: matchError } = await supabase
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
      .or(`home_team_id.eq.${progress.team_id},away_team_id.eq.${progress.team_id}`)
      .eq('status', 'finished')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (matchError) {
      console.log('❌ Erro ao buscar partidas:', matchError.message);
      return;
    }

    if (!userMatches || userMatches.length === 0) {
      console.log('⚠️ Nenhuma partida encontrada');
      return;
    }

    console.log(`\n⚽ Encontradas ${userMatches.length} partidas:`);
    userMatches.forEach((match, index) => {
      const isUserHome = match.home_team_id === progress.team_id;
      const userTeam = isUserHome ? match.home_team : match.away_team;
      const machineTeam = isUserHome ? match.away_machine : match.home_machine;
      
      console.log(`   ${index + 1}. ${userTeam?.name || 'Usuário'} ${match.home_score} x ${match.away_score} ${machineTeam?.name || 'Time da Máquina'}`);
      console.log(`      Rodada: ${match.round_number}, Data: ${match.updated_at}`);
    });

    // Usar a primeira partida para o teste
    const recentMatch = userMatches[0];

    if (matchError) {
      console.log('❌ Erro ao buscar partida recente:', matchError.message);
      return;
    }

    if (!recentMatch) {
      console.log('⚠️ Nenhuma partida recente encontrada');
      return;
    }

    console.log(`\n⚽ Partida encontrada:`);
    const isUserHome = recentMatch.home_team_id !== null;
    const userTeam = isUserHome ? recentMatch.home_team : recentMatch.away_team;
    const machineTeam = isUserHome ? recentMatch.away_machine : recentMatch.home_machine;
    
    console.log(`   ${userTeam?.name || 'Usuário'} ${recentMatch.home_score} x ${recentMatch.away_score} ${machineTeam?.name || 'Time da Máquina'}`);
    console.log(`   Rodada: ${recentMatch.round_number}, Data: ${recentMatch.updated_at}`);

    // 4. Verificar estatísticas atuais do time da máquina
    const { data: currentStats, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('team_id', machineTeam.id)
      .eq('season_year', progress.season_year)
      .eq('tier', progress.current_tier)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.log('❌ Erro ao buscar estatísticas:', statsError.message);
      return;
    }

    if (currentStats) {
      console.log(`\n📊 Estatísticas atuais do ${machineTeam.name}:`);
      console.log(`   Jogos: ${currentStats.games_played}`);
      console.log(`   Vitórias: ${currentStats.wins}`);
      console.log(`   Empates: ${currentStats.draws}`);
      console.log(`   Derrotas: ${currentStats.losses}`);
      console.log(`   Pontos: ${currentStats.points}`);
      console.log(`   Gols pró: ${currentStats.goals_for}`);
      console.log(`   Gols contra: ${currentStats.goals_against}`);
    } else {
      console.log(`\n⚠️ Nenhuma estatística encontrada para ${machineTeam.name}`);
    }

    // 5. Simular manualmente a atualização das estatísticas
    console.log(`\n🔧 Simulando atualização manual das estatísticas...`);
    
    const machineGoalsFor = isUserHome ? recentMatch.away_score : recentMatch.home_score;
    const machineGoalsAgainst = isUserHome ? recentMatch.home_score : recentMatch.away_score;
    
    // Determinar resultado para o time da máquina
    let wins = 0, draws = 0, losses = 0, points = 0;
    if (machineGoalsFor > machineGoalsAgainst) {
      wins = 1;
      points = 3;
    } else if (machineGoalsFor === machineGoalsAgainst) {
      draws = 1;
      points = 1;
    } else {
      losses = 1;
      points = 0;
    }

    if (currentStats) {
      // Atualizar estatísticas existentes
      const { error: updateError } = await supabase
        .from('game_user_machine_team_stats')
        .update({
          games_played: currentStats.games_played + 1,
          wins: currentStats.wins + wins,
          draws: currentStats.draws + draws,
          losses: currentStats.losses + losses,
          goals_for: currentStats.goals_for + machineGoalsFor,
          goals_against: currentStats.goals_against + machineGoalsAgainst,
          points: currentStats.points + points,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('team_id', machineTeam.id)
        .eq('season_year', progress.season_year)
        .eq('tier', progress.current_tier);

      if (updateError) {
        console.log('❌ Erro ao atualizar estatísticas:', updateError.message);
        return;
      }

      console.log(`✅ Estatísticas atualizadas com sucesso!`);
    } else {
      // Criar novas estatísticas
      const { error: insertError } = await supabase
        .from('game_user_machine_team_stats')
        .insert({
          user_id: user.id,
          team_id: machineTeam.id,
          season_year: progress.season_year,
          tier: progress.current_tier,
          games_played: 1,
          wins: wins,
          draws: draws,
          losses: losses,
          goals_for: machineGoalsFor,
          goals_against: machineGoalsAgainst,
          points: points,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.log('❌ Erro ao criar estatísticas:', insertError.message);
        return;
      }

      console.log(`✅ Novas estatísticas criadas com sucesso!`);
    }

    // 6. Verificar estatísticas atualizadas
    const { data: updatedStats, error: updatedStatsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('team_id', machineTeam.id)
      .eq('season_year', progress.season_year)
      .eq('tier', progress.current_tier)
      .single();

    if (updatedStatsError) {
      console.log('❌ Erro ao buscar estatísticas atualizadas:', updatedStatsError.message);
      return;
    }

    console.log(`\n📈 Estatísticas atualizadas do ${machineTeam.name}:`);
    console.log(`   Jogos: ${updatedStats.games_played}`);
    console.log(`   Vitórias: ${updatedStats.wins}`);
    console.log(`   Empates: ${updatedStats.draws}`);
    console.log(`   Derrotas: ${updatedStats.losses}`);
    console.log(`   Pontos: ${updatedStats.points}`);
    console.log(`   Gols pró: ${updatedStats.goals_for}`);
    console.log(`   Gols contra: ${updatedStats.goals_against}`);

    console.log(`\n✅ Teste concluído! O time da máquina ${machineTeam.name} agora tem ${updatedStats.games_played} jogos.`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testMachineTeamUpdate().then(() => {
  console.log('🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no script:', error);
  process.exit(1);
});
