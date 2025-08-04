const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testPositionCalculation() {
  try {
    console.log('🧪 Testando cálculo de posição...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    // Buscar usuários com temporadas ativas
    const { data: users, error: usersError } = await supabase
      .from('game_user_competition_progress')
      .select(`
        user_id,
        team_id,
        current_tier,
        season_year,
        points,
        games_played,
        wins,
        draws,
        losses,
        goals_for,
        goals_against,
        position
      `)
      .eq('season_status', 'active')
      .order('current_tier', { ascending: true })
      .order('points', { ascending: false });
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${users.length} usuários com temporadas ativas`);
    
    for (const user of users) {
      console.log(`\n👤 Usuário: ${user.user_id}`);
      console.log(`   Série: ${user.current_tier} (${getTierName(user.current_tier)})`);
      console.log(`   Temporada: ${user.season_year}`);
      console.log(`   Pontos: ${user.points}`);
      console.log(`   Jogos: ${user.games_played}`);
      console.log(`   Posição atual: ${user.position}`);
      
      // Buscar estatísticas dos times da máquina da mesma série
      const { data: machineStats, error: statsError } = await supabase
        .from('game_user_machine_team_stats')
        .select('team_id, points, goals_for, goals_against')
        .eq('user_id', user.user_id)
        .eq('season_year', user.season_year)
        .eq('tier', user.current_tier);
      
      if (statsError) {
        console.log(`   ❌ Erro ao buscar estatísticas: ${statsError.message}`);
        continue;
      }
      
      // Buscar times da máquina
      const { data: machineTeams, error: teamsError } = await supabase
        .from('game_machine_teams')
        .select('id, name')
        .eq('tier', user.current_tier)
        .eq('is_active', true);
      
      if (teamsError) {
        console.log(`   ❌ Erro ao buscar times da máquina: ${teamsError.message}`);
        continue;
      }
      
      // Calcular posição manualmente
      const allStandings = [];
      
      // Adicionar usuário
      allStandings.push({
        team_id: user.team_id,
        team_type: 'user',
        points: user.points,
        goals_for: user.goals_for,
        goals_against: user.goals_against,
        goal_difference: user.goals_for - user.goals_against
      });
      
      // Adicionar times da máquina
      for (const team of machineTeams) {
        const teamStats = machineStats?.find(stat => stat.team_id === team.id);
        const stats = teamStats || {
          points: 0,
          goals_for: 0,
          goals_against: 0
        };
        
        allStandings.push({
          team_id: team.id,
          team_type: 'machine',
          points: stats.points,
          goals_for: stats.goals_for,
          goals_against: stats.goals_against,
          goal_difference: stats.goals_for - stats.goals_against
        });
      }
      
      // Ordenar
      allStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });
      
      // Encontrar posição do usuário
      const calculatedPosition = allStandings.findIndex(standing => standing.team_type === 'user') + 1;
      
      console.log(`   📊 Posição calculada: ${calculatedPosition} de ${allStandings.length}`);
      console.log(`   📊 Posição no banco: ${user.position}`);
      
      if (calculatedPosition !== user.position) {
        console.log(`   ⚠️ POSIÇÃO DIFERENTE! Calculada: ${calculatedPosition}, Banco: ${user.position}`);
        
        // Atualizar posição no banco
        const { error: updateError } = await supabase
          .from('game_user_competition_progress')
          .update({ position: calculatedPosition })
          .eq('user_id', user.user_id)
          .eq('team_id', user.team_id)
          .eq('season_year', user.season_year);
        
        if (updateError) {
          console.log(`   ❌ Erro ao atualizar posição: ${updateError.message}`);
        } else {
          console.log(`   ✅ Posição atualizada para ${calculatedPosition}`);
        }
      } else {
        console.log(`   ✅ Posição correta`);
      }
      
      // Mostrar top 5 da classificação
      console.log(`   🏆 Top 5 da classificação:`);
      allStandings.slice(0, 5).forEach((standing, index) => {
        const teamName = standing.team_type === 'user' ? 'Seu Time' : 
          machineTeams.find(t => t.id === standing.team_id)?.name || 'Time Desconhecido';
        console.log(`      ${index + 1}. ${teamName} - ${standing.points} pts (${standing.goals_for}-${standing.goals_against})`);
      });
    }
    
    console.log('\n✅ Teste de cálculo de posição concluído');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || 'Desconhecida';
}

testPositionCalculation(); 