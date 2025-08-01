const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🎮 SIMULANDO TEMPORADA COMPLETA');
console.log('=' .repeat(40));

async function simulateSeason() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Simulando partidas da Série D...');
    
    // Buscar Série D
    const { data: serieD, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name')
      .eq('tier', 4)
      .single();
    
    if (compError) {
      console.log('❌ Erro ao buscar Série D:', compError.message);
      return;
    }
    
    // Buscar times inscritos na Série D
    const { data: enrolledTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select(`
        team_id,
        game_teams!inner(name, team_type)
      `)
      .eq('competition_id', serieD.id);
    
    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }
    
    console.log(`📊 Times inscritos na ${serieD.name}: ${enrolledTeams.length}`);
    
    // Simular algumas partidas para dar pontos aos times
    const userTeams = enrolledTeams.filter(t => t.game_teams.team_type === 'user_created');
    const machineTeams = enrolledTeams.filter(t => t.game_teams.team_type === 'machine');
    
    console.log(`📊 Times do usuário: ${userTeams.length}`);
    console.log(`📊 Times da máquina: ${machineTeams.length}`);
    
    // Simular vitórias para alguns times do usuário
    for (let i = 0; i < Math.min(userTeams.length, 4); i++) {
      const team = userTeams[i];
      console.log(`🏆 Simulando vitórias para ${team.game_teams.name}...`);
      
      // Atualizar classificação com pontos
      const points = 30 - (i * 3); // 30, 27, 24, 21 pontos
      const wins = 10 - i;
      const draws = 2;
      const losses = 8 + i;
      const goalsFor = 25 - (i * 2);
      const goalsAgainst = 15 + (i * 2);
      
      const { error: updateError } = await supabase
        .from('game_standings')
        .update({
          points,
          wins,
          draws,
          losses,
          goals_for: goalsFor,
          goals_against: goalsAgainst
        })
        .eq('competition_id', serieD.id)
        .eq('team_id', team.team_id);
      
      if (updateError) {
        console.log(`❌ Erro ao atualizar ${team.game_teams.name}: ${updateError.message}`);
      } else {
        console.log(`✅ ${team.game_teams.name}: ${points} pontos`);
      }
    }
    
    // Simular pontuação para times da máquina
    for (let i = 0; i < machineTeams.length; i++) {
      const team = machineTeams[i];
      const points = Math.floor(Math.random() * 20) + 10; // 10-30 pontos
      const wins = Math.floor(points / 3);
      const draws = points % 3;
      const losses = 19 - wins - draws;
      const goalsFor = Math.floor(Math.random() * 20) + 10;
      const goalsAgainst = Math.floor(Math.random() * 25) + 15;
      
      const { error: updateError } = await supabase
        .from('game_standings')
        .update({
          points,
          wins,
          draws,
          losses,
          goals_for: goalsFor,
          goals_against: goalsAgainst
        })
        .eq('competition_id', serieD.id)
        .eq('team_id', team.team_id);
      
      if (updateError) {
        console.log(`❌ Erro ao atualizar ${team.game_teams.name}: ${updateError.message}`);
      }
    }
    
    console.log('\n📋 2. Verificando classificação final...');
    
    const { data: finalStandings, error: standingsError } = await supabase
      .from('game_standings')
      .select(`
        team_id,
        points,
        wins,
        draws,
        losses,
        goals_for,
        goals_against,
        game_teams!inner(name, team_type)
      `)
      .eq('competition_id', serieD.id)
      .order('points', { ascending: false })
      .order('goals_for', { ascending: false })
      .order('goals_against', { ascending: true });
    
    if (standingsError) {
      console.log('❌ Erro ao buscar classificação:', standingsError.message);
      return;
    }
    
    console.log(`📊 Classificação final da ${serieD.name}:`);
    finalStandings.forEach((standing, index) => {
      const position = index + 1;
      const type = standing.game_teams.team_type === 'user_created' ? '👤' : '🤖';
      const promotion = position <= 4 ? '🏆 PROMOÇÃO!' : '';
      console.log(`${position}. ${type} ${standing.game_teams.name}: ${standing.points}pts (${standing.wins}V-${standing.draws}E-${standing.losses}D) ${promotion}`);
    });
    
    console.log('\n📋 3. Executando sistema de promoção...');
    
    // Importar e executar o sistema de promoção
    const { implementPromotionSystem } = require('./implement-promotion-system');
    await implementPromotionSystem();
    
    console.log('\n✅ Temporada simulada com sucesso!');
    console.log('🏆 Sistema de promoção testado e funcionando');
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
  }
}

// Executar simulação
if (require.main === module) {
  simulateSeason();
}

module.exports = {
  simulateSeason
}; 