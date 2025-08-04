const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function checkPromotedUserStatus() {
  try {
    console.log('🔍 Verificando status do usuário promovido...');
    const supabase = getSupabaseServiceClient('vps');
    
    const userId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';
    
    // Buscar todas as temporadas do usuário
    const { data: allProgress, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select(`user_id, team_id, current_tier, season_year, points, games_played, wins, draws, losses, goals_for, goals_against, position, season_status`)
      .eq('user_id', userId)
      .order('season_year', { ascending: false });
    
    if (progressError) {
      console.log('❌ Erro ao buscar progresso:', progressError.message);
      return;
    }
    
    console.log(`📊 Encontradas ${allProgress.length} temporadas para o usuário ${userId}`);
    
    for (const progress of allProgress) {
      console.log(`\n📅 Temporada ${progress.season_year}:`);
      console.log(`   Série: ${progress.current_tier} (${getTierName(progress.current_tier)})`);
      console.log(`   Status: ${progress.season_status}`);
      console.log(`   Posição: ${progress.position}º lugar`);
      console.log(`   Pontos: ${progress.points}`);
      console.log(`   Jogos: ${progress.games_played}/38`);
      
      // Verificar partidas da temporada
      const { data: matches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('status, tier')
        .eq('user_id', userId)
        .eq('season_year', progress.season_year);
      
      if (matchesError) {
        console.log(`   ❌ Erro ao buscar partidas: ${matchesError.message}`);
      } else {
        const totalMatches = matches?.length || 0;
        const finishedMatches = matches?.filter(m => m.status === 'finished').length || 0;
        const tier = matches?.[0]?.tier || progress.current_tier;
        
        console.log(`   📊 Partidas: ${finishedMatches}/${totalMatches} finalizadas`);
        console.log(`   🏆 Série das partidas: ${tier} (${getTierName(tier)})`);
        
        if (tier !== progress.current_tier) {
          console.log(`   ⚠️ INCONSISTÊNCIA: Progresso diz Série ${progress.current_tier} mas partidas são da Série ${tier}`);
        }
      }
      
      // Verificar estatísticas de times da máquina
      const { data: machineStats, error: statsError } = await supabase
        .from('game_user_machine_team_stats')
        .select('team_id, points, goals_for, goals_against')
        .eq('user_id', userId)
        .eq('season_year', progress.season_year)
        .eq('tier', progress.current_tier);
      
      if (statsError) {
        console.log(`   ❌ Erro ao buscar estatísticas: ${statsError.message}`);
      } else {
        console.log(`   🤖 Estatísticas de times da máquina: ${machineStats?.length || 0} times`);
      }
    }
    
    // Verificar histórico de temporadas
    const { data: history, error: historyError } = await supabase
      .from('game_season_history')
      .select('*')
      .eq('user_id', userId)
      .order('season_year', { ascending: false });
    
    if (historyError) {
      console.log('❌ Erro ao buscar histórico:', historyError.message);
    } else {
      console.log(`\n📜 Histórico de temporadas: ${history?.length || 0} registros`);
      for (const record of history || []) {
        console.log(`   ${record.season_year}: ${record.result} - Série ${getTierName(record.tier)} → Série ${getTierName(record.next_tier)}`);
      }
    }
    
    console.log('\n✅ Verificação do usuário promovido concluída');
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || 'Desconhecida';
}

checkPromotedUserStatus(); 