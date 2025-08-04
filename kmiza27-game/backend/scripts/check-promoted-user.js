const { getSupabaseServiceClient } = require('../config/supabase-connection');
const supabase = getSupabaseServiceClient('vps');

async function checkPromotedUser() {
  try {
    // Buscar usuário promovido (22fa9e4b...)
    const userId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';
    
    console.log('🔍 Verificando usuário promovido para Série C...');
    console.log(`User ID: ${userId}`);
    
    // 1. Verificar progresso na Série C
    console.log('\n📋 Passo 1: Progresso na Série C (2026)...');
    const { data: progressC, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('current_tier', 3)
      .eq('season_year', 2026)
      .single();

    if (progressError) {
      console.log('❌ Erro ao buscar progresso Série C:', progressError.message);
    } else {
      console.log('✅ Progresso Série C encontrado:');
      console.log(`   - Status: ${progressC.season_status}`);
      console.log(`   - Pontos: ${progressC.points}`);
      console.log(`   - Jogos: ${progressC.games_played}`);
    }

    // 2. Verificar partidas da Série C
    console.log('\n📋 Passo 2: Partidas da Série C (2026)...');
    const { data: matchesC, error: matchesError } = await supabase
      .from('game_season_matches')
      .select('*')
      .eq('user_id', userId)
      .eq('season_year', 2026);

    if (matchesError) {
      console.log('❌ Erro ao buscar partidas Série C:', matchesError.message);
    } else {
      console.log(`✅ Partidas Série C: ${matchesC?.length || 0}`);
      if (matchesC && matchesC.length > 0) {
        const finished = matchesC.filter(m => m.status === 'finished').length;
        const scheduled = matchesC.filter(m => m.status === 'scheduled').length;
        console.log(`   - Finalizadas: ${finished}`);
        console.log(`   - Agendadas: ${scheduled}`);
      }
    }

    // 3. Verificar estatísticas dos times da máquina da Série C
    console.log('\n📋 Passo 3: Estatísticas dos times da máquina Série C...');
    const { data: statsC, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select(`
        *,
        game_machine_teams(name, tier)
      `)
      .eq('user_id', userId)
      .eq('season_year', 2026)
      .eq('tier', 3);

    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas Série C:', statsError.message);
    } else {
      console.log(`✅ Estatísticas Série C: ${statsC?.length || 0}`);
      if (statsC && statsC.length > 0) {
        const sampleStats = statsC.slice(0, 5);
        sampleStats.forEach(stat => {
          const teamName = stat.game_machine_teams?.name || 'Time Desconhecido';
          console.log(`   - ${teamName}: ${stat.points}pts, ${stat.games_played} jogos`);
        });
      }
    }

    // 4. Verificar times da máquina da Série C
    console.log('\n📋 Passo 4: Times da máquina da Série C...');
    const { data: teamsC, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('id, name, tier')
      .eq('tier', 3)
      .eq('is_active', true);

    if (teamsError) {
      console.log('❌ Erro ao buscar times Série C:', teamsError.message);
    } else {
      console.log(`✅ Times da máquina Série C: ${teamsC?.length || 0}`);
      if (teamsC && teamsC.length > 0) {
        teamsC.slice(0, 5).forEach(team => {
          console.log(`   - ${team.name}`);
        });
        if (teamsC.length > 5) {
          console.log(`   ... e mais ${teamsC.length - 5} times`);
        }
      }
    }

    // 5. Análise final
    console.log('\n📋 Passo 5: Análise final...');
    
    if (progressC) {
      console.log('✅ Usuário está na Série C');
    } else {
      console.log('❌ Usuário não está na Série C');
    }

    if (matchesC && matchesC.length > 0) {
      console.log('✅ Partidas da Série C criadas');
    } else {
      console.log('❌ Partidas da Série C não criadas');
    }

    if (statsC && statsC.length > 0) {
      console.log('✅ Estatísticas dos times da máquina Série C criadas');
    } else {
      console.log('❌ Estatísticas dos times da máquina Série C não criadas');
    }

    if (teamsC && teamsC.length > 0) {
      console.log('✅ Times da máquina da Série C existem');
    } else {
      console.log('❌ Times da máquina da Série C não existem');
    }

    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

checkPromotedUser(); 