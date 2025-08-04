const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testApiStandings() {
  const supabase = getSupabaseServiceClient('vps');
  const userId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';

  console.log('🧪 Testando API de classificação...');
  console.log(`👤 Usuário: ${userId}`);

  try {
    // 1. Verificar progresso atual
    console.log('\n📊 Verificando progresso atual...');
    const { data: currentProgress, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', userId)
      .order('season_year', { ascending: false })
      .limit(1);

    if (progressError) {
      console.error('❌ Erro ao buscar progresso:', progressError);
      return;
    }

    if (currentProgress && currentProgress.length > 0) {
      const progress = currentProgress[0];
      console.log('✅ Progresso atual encontrado:');
      console.log(`   Temporada: ${progress.season_year}`);
      console.log(`   Série: ${progress.current_tier}`);
      console.log(`   Pontos: ${progress.points}`);
      console.log(`   Jogos: ${progress.games_played}/38`);

      // 2. Verificar estatísticas dos times da máquina para esta temporada
      console.log('\n🤖 Verificando estatísticas dos times da máquina...');
      const { data: machineStats, error: statsError } = await supabase
        .from('game_user_machine_team_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', progress.season_year)
        .eq('tier', progress.current_tier);

      if (statsError) {
        console.error('❌ Erro ao buscar estatísticas:', statsError);
      } else {
        console.log(`✅ Encontradas ${machineStats?.length || 0} estatísticas de times da máquina`);
        if (machineStats && machineStats.length > 0) {
          console.log('   Exemplos de estatísticas:');
          machineStats.slice(0, 3).forEach((stat, index) => {
            console.log(`   ${index + 1}. ${stat.team_name}: ${stat.points} pts, ${stat.games_played} jogos`);
          });
        }
      }

      // 3. Simular a lógica da API getFullStandings
      console.log('\n📊 Simulando lógica da API getFullStandings...');
      
      // Buscar times da máquina
      const { data: machineTeams, error: teamsError } = await supabase
        .from('game_machine_teams')
        .select('*')
        .eq('tier', progress.current_tier);

      if (teamsError) {
        console.error('❌ Erro ao buscar times da máquina:', teamsError);
        return;
      }

      console.log(`✅ Encontrados ${machineTeams?.length || 0} times da máquina`);

      // Combinar dados do usuário com times da máquina
      const allStandings = [];

      // Adicionar times da máquina
      if (machineTeams) {
        for (const team of machineTeams) {
          const teamStats = machineStats?.find(s => s.team_id === team.id) || {
            points: 0, games_played: 0, wins: 0, draws: 0, losses: 0,
            goals_for: 0, goals_against: 0
          };

          allStandings.push({
            position: 0, // Será calculado depois
            team_name: team.name,
            team_type: 'machine',
            team_id: team.id,
            points: teamStats.points,
            games_played: teamStats.games_played,
            wins: teamStats.wins,
            draws: teamStats.draws,
            losses: teamStats.losses,
            goals_for: teamStats.goals_for,
            goals_against: teamStats.goals_against,
            goal_difference: teamStats.goals_for - teamStats.goals_against
          });
        }
      }

      // Adicionar time do usuário
      allStandings.push({
        position: 0, // Será calculado depois
        team_name: 'TETE (Seu time)',
        team_type: 'user',
        team_id: progress.team_id,
        points: progress.points,
        games_played: progress.games_played,
        wins: progress.wins,
        draws: progress.draws,
        losses: progress.losses,
        goals_for: progress.goals_for,
        goals_against: progress.goals_against,
        goal_difference: progress.goals_for - progress.goals_against
      });

      // Ordenar por pontos, saldo de gols, gols feitos
      allStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

      // Atualizar posições
      allStandings.forEach((team, index) => {
        team.position = index + 1;
      });

      console.log('\n📋 Classificação simulada:');
      allStandings.slice(0, 10).forEach(team => {
        const type = team.team_type === 'user' ? '👤' : '🤖';
        console.log(`   ${team.position}º ${type} ${team.team_name}: ${team.points} pts, ${team.games_played} jogos`);
      });

      // Verificar se o time do usuário está com pontos zerados
      const userTeam = allStandings.find(t => t.team_type === 'user');
      if (userTeam) {
        console.log(`\n🎯 Time do usuário: ${userTeam.team_name}`);
        console.log(`   Posição: ${userTeam.position}º`);
        console.log(`   Pontos: ${userTeam.points}`);
        console.log(`   Jogos: ${userTeam.games_played}/38`);
        
        if (userTeam.points === 0 && userTeam.games_played === 0) {
          console.log('✅ Pontos zerados corretamente!');
        } else {
          console.log('❌ Pontos não foram zerados!');
        }
      }
    } else {
      console.log('❌ Nenhum progresso encontrado');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testApiStandings(); 