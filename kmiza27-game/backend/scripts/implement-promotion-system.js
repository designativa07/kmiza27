const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🏆 IMPLEMENTANDO SISTEMA DE PROMOÇÃO/REBAIXAMENTO');
console.log('=' .repeat(50));

async function implementPromotionSystem() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Verificando competições...');
    
    // Buscar todas as competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, promotion_spots, relegation_spots')
      .order('tier');
    
    if (compError) {
      console.log('❌ Erro ao buscar competições:', compError.message);
      return;
    }
    
    console.log(`📊 Competições encontradas: ${competitions.length}`);
    
    // Para cada competição, processar promoção/rebaixamento
    for (const competition of competitions) {
      console.log(`\n📋 2. Processando ${competition.name}...`);
      
      // Buscar classificação atual
      const { data: standings, error: standingsError } = await supabase
        .from('game_standings')
        .select(`
          id,
          team_id,
          points,
          wins,
          draws,
          losses,
          goals_for,
          goals_against,
          game_teams!inner(name, team_type, owner_id)
        `)
        .eq('competition_id', competition.id)
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false })
        .order('goals_against', { ascending: true });
      
      if (standingsError) {
        console.log(`❌ Erro ao buscar classificação: ${standingsError.message}`);
        continue;
      }
      
      if (!standings || standings.length === 0) {
        console.log(`📊 ${competition.name} não tem times inscritos`);
        continue;
      }
      
      console.log(`📊 ${competition.name}: ${standings.length} times`);
      
      // Separar times da máquina e times do usuário
      const machineTeams = standings.filter(s => s.game_teams.team_type === 'machine');
      const userTeams = standings.filter(s => s.game_teams.team_type === 'user_created');
      
      console.log(`📊 Times da máquina: ${machineTeams.length}`);
      console.log(`📊 Times do usuário: ${userTeams.length}`);
      
      // Processar promoção (apenas times do usuário podem subir)
      if (competition.promotion_spots > 0) {
        console.log(`🏆 Processando promoção: ${competition.promotion_spots} vagas`);
        
        const teamsToPromote = userTeams.slice(0, competition.promotion_spots);
        
        for (const team of teamsToPromote) {
          console.log(`✅ ${team.game_teams.name} promovido para Série ${competition.tier - 1}`);
          
          // Remover da competição atual
          await supabase
            .from('game_competition_teams')
            .delete()
            .eq('competition_id', competition.id)
            .eq('team_id', team.team_id);
          
          // Remover da classificação atual
          await supabase
            .from('game_standings')
            .delete()
            .eq('competition_id', competition.id)
            .eq('team_id', team.team_id);
          
          // Encontrar competição superior
          const upperCompetition = competitions.find(c => c.tier === competition.tier - 1);
          if (upperCompetition) {
            // Inscrever na competição superior
            await supabase
              .from('game_competition_teams')
              .insert({
                competition_id: upperCompetition.id,
                team_id: team.team_id
              });
            
            // Criar entrada na classificação da competição superior
            await supabase
              .from('game_standings')
              .insert({
                competition_id: upperCompetition.id,
                team_id: team.team_id,
                points: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goals_for: 0,
                goals_against: 0,
                season_year: 2025
              });
            
            console.log(`✅ ${team.game_teams.name} inscrito na ${upperCompetition.name}`);
          }
        }
      }
      
      // Processar rebaixamento (apenas times da máquina podem descer)
      if (competition.relegation_spots > 0) {
        console.log(`⬇️  Processando rebaixamento: ${competition.relegation_spots} vagas`);
        
        const teamsToRelegate = machineTeams.slice(-competition.relegation_spots);
        
        for (const team of teamsToRelegate) {
          console.log(`⬇️  ${team.game_teams.name} rebaixado para Série ${competition.tier + 1}`);
          
          // Remover da competição atual
          await supabase
            .from('game_competition_teams')
            .delete()
            .eq('competition_id', competition.id)
            .eq('team_id', team.team_id);
          
          // Remover da classificação atual
          await supabase
            .from('game_standings')
            .delete()
            .eq('competition_id', competition.id)
            .eq('team_id', team.team_id);
          
          // Encontrar competição inferior
          const lowerCompetition = competitions.find(c => c.tier === competition.tier + 1);
          if (lowerCompetition) {
            // Inscrever na competição inferior
            await supabase
              .from('game_competition_teams')
              .insert({
                competition_id: lowerCompetition.id,
                team_id: team.team_id
              });
            
            // Criar entrada na classificação da competição inferior
            await supabase
              .from('game_standings')
              .insert({
                competition_id: lowerCompetition.id,
                team_id: team.team_id,
                points: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goals_for: 0,
                goals_against: 0,
                season_year: 2025
              });
            
            console.log(`⬇️  ${team.game_teams.name} inscrito na ${lowerCompetition.name}`);
          }
        }
      }
    }
    
    // Atualizar contadores das competições
    console.log('\n📋 3. Atualizando contadores das competições...');
    
    for (const competition of competitions) {
      const { data: enrolledTeams, error: countError } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', competition.id);
      
      if (countError) {
        console.log(`❌ Erro ao contar times: ${countError.message}`);
        continue;
      }
      
      const actualCount = enrolledTeams ? enrolledTeams.length : 0;
      
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: actualCount })
        .eq('id', competition.id);
      
      if (updateError) {
        console.log(`❌ Erro ao atualizar contador: ${updateError.message}`);
      } else {
        console.log(`✅ ${competition.name}: ${actualCount} times`);
      }
    }
    
    // Verificar resultado final
    console.log('\n📋 4. Verificando resultado final...');
    const { data: finalCompetitions, error: finalError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams, promotion_spots, relegation_spots');
    
    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
      return;
    }
    
    console.log('📊 Status final das competições:');
    finalCompetitions.forEach(comp => {
      console.log(`  - ${comp.name} (Série ${comp.tier}): ${comp.current_teams}/${comp.max_teams} times`);
    });
    
    console.log('\n✅ Sistema de promoção/rebaixamento implementado!');
    console.log('🏆 Times promovidos e rebaixados com sucesso');
    
  } catch (error) {
    console.error('❌ Erro na implementação:', error);
  }
}

// Executar implementação
if (require.main === module) {
  implementPromotionSystem();
}

module.exports = {
  implementPromotionSystem
}; 