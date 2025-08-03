const { getSupabaseClient } = require('../config/supabase-connection');

async function resetSeasonStandings() {
  console.log('🔄 Resetando classificação da temporada para que todos comecem zerados...\n');

  const supabase = getSupabaseClient('vps');

  try {
    // 1. Resetar progresso dos usuários
    console.log('📊 Resetando progresso dos usuários...');
    
    const { data: resetUsers, error: resetUsersError } = await supabase
      .from('game_user_competition_progress')
      .update({
        position: 1,
        points: 0,
        games_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        season_status: 'active'
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // WHERE clause para Supabase
      .select();

    if (resetUsersError) {
      console.error('❌ Erro ao resetar usuários:', resetUsersError);
      return;
    }

    console.log(`✅ ${resetUsers?.length || 0} usuários resetados`);

    // 2. Resetar todas as partidas para 'scheduled'
    console.log('⚽ Resetando partidas para agendadas...');
    
    const { data: resetMatches, error: resetMatchesError } = await supabase
      .from('game_season_matches')
      .update({
        home_score: 0,
        away_score: 0,
        status: 'scheduled',
        highlights: [],
        simulation_data: {},
        updated_at: new Date().toISOString()
      })
      .or('status.eq.finished,status.eq.simulated,status.eq.in_progress') // Só resetar as que foram jogadas
      .select();

    if (resetMatchesError) {
      console.error('❌ Erro ao resetar partidas:', resetMatchesError);
      return;
    }

    console.log(`✅ ${resetMatches?.length || 0} partidas resetadas para agendadas`);

    // 3. Verificar resultado
    console.log('\n📋 Verificando resultado...');
    
    const { data: users, error: usersError } = await supabase
      .from('game_user_competition_progress')
      .select(`
        user_id,
        current_tier,
        points,
        games_played,
        position,
        season_status
      `);

    if (usersError) {
      console.error('❌ Erro ao verificar usuários:', usersError);
      return;
    }

    console.log('👥 Status dos usuários após reset:');
    users?.forEach(user => {
      console.log(`   🎮 Usuário ${user.user_id.slice(0, 8)}... - Série ${getTierName(user.current_tier)} - ${user.points} pts - ${user.games_played} jogos - ${user.position}º lugar`);
    });

    const { data: matches, error: matchesError } = await supabase
      .from('game_season_matches')
      .select('status')
      .eq('status', 'scheduled');

    if (!matchesError) {
      console.log(`📅 ${matches?.length || 0} partidas agendadas prontas para jogar`);
    }

    console.log('\n🎉 Reset concluído! Todos os times agora começam zerados.');
    console.log('💡 Os usuários podem jogar as partidas em ordem e toda a classificação evoluirá juntos.');

  } catch (error) {
    console.error('💥 Erro durante reset:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || 'Desconhecida';
}

// Executar se chamado diretamente
if (require.main === module) {
  resetSeasonStandings()
    .then(() => {
      console.log('✅ Script concluído');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script falhou:', error);
      process.exit(1);
    });
}

module.exports = { resetSeasonStandings };