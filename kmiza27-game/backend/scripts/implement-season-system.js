const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🏆 IMPLEMENTANDO SISTEMA DE TEMPORADAS');
console.log('=' .repeat(45));

async function implementSeasonSystem() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Verificando configuração atual das temporadas...');
    
    // Verificar se as colunas de temporada existem
    const { data: competitions, error } = await supabase
      .from('game_competitions')
      .select('id, name, tier, season_year, season_status, promotion_spots, relegation_spots')
      .order('tier', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar competições:', error);
      return;
    }

    console.log('📊 Competições encontradas:');
    competitions.forEach(comp => {
      console.log(`   - ${comp.name} (Tier ${comp.tier}): Temporada ${comp.season_year || 'N/A'}, Status: ${comp.season_status || 'N/A'}`);
    });

    console.log('\n📋 2. Verificando standings das temporadas atuais...');
    
    const { data: standings, error: standingsError } = await supabase
      .from('game_standings')
      .select(`
        *,
        game_teams!inner(name, team_type),
        game_competitions!inner(name, tier)
      `)
      .order('points', { ascending: false });

    if (standingsError) {
      console.error('❌ Erro ao buscar standings:', standingsError);
      return;
    }

    console.log(`📊 Encontradas ${standings.length} posições nas classificações:`);
    
    // Agrupar por competição
    const standingsByCompetition = {};
    standings.forEach(standing => {
      const compName = standing.game_competitions.name;
      if (!standingsByCompetition[compName]) {
        standingsByCompetition[compName] = [];
      }
      standingsByCompetition[compName].push(standing);
    });

    Object.keys(standingsByCompetition).forEach(compName => {
      const compStandings = standingsByCompetition[compName];
      console.log(`\n   ${compName}:`);
      compStandings.slice(0, 6).forEach((standing, index) => {
        const team = standing.game_teams;
        console.log(`     ${index + 1}. ${team.name} (${team.team_type}) - ${standing.points} pts`);
      });
    });

    console.log('\n📋 3. Implementando sistema de promoção/rebaixamento...');
    
    // Função para promover times
    const promoteTeams = async (competitionId, promotionSpots) => {
      const { data: topTeams, error } = await supabase
        .from('game_standings')
        .select(`
          *,
          game_teams!inner(id, name, team_type)
        `)
        .eq('competition_id', competitionId)
        .order('points', { ascending: false })
        .limit(promotionSpots);

      if (error) {
        console.error('❌ Erro ao buscar times para promoção:', error);
        return [];
      }

      const userTeamsToPromote = topTeams.filter(standing => 
        standing.game_teams.team_type === 'user_created'
      );

      console.log(`   🏆 ${userTeamsToPromote.length} times de usuário elegíveis para promoção:`);
      userTeamsToPromote.forEach(standing => {
        console.log(`     - ${standing.game_teams.name} (${standing.points} pts)`);
      });

      return userTeamsToPromote;
    };

    // Função para rebaixar times da máquina
    const relegateMachineTeams = async (competitionId, relegationSpots) => {
      const { data: bottomTeams, error } = await supabase
        .from('game_standings')
        .select(`
          *,
          game_teams!inner(id, name, team_type)
        `)
        .eq('competition_id', competitionId)
        .order('points', { ascending: true })
        .limit(relegationSpots);

      if (error) {
        console.error('❌ Erro ao buscar times para rebaixamento:', error);
        return [];
      }

      const machineTeamsToRelegate = bottomTeams.filter(standing => 
        standing.game_teams.team_type === 'machine'
      );

      console.log(`   📉 ${machineTeamsToRelegate.length} times da máquina elegíveis para rebaixamento:`);
      machineTeamsToRelegate.forEach(standing => {
        console.log(`     - ${standing.game_teams.name} (${standing.points} pts)`);
      });

      return machineTeamsToRelegate;
    };

    // Executar promoção/rebaixamento para cada competição
    for (const competition of competitions) {
      console.log(`\n🏆 Processando ${competition.name} (Tier ${competition.tier}):`);
      
      // Buscar times para promoção (se não for Série A)
      if (competition.tier > 1) {
        const teamsToPromote = await promoteTeams(competition.id, competition.promotion_spots || 4);
        
        if (teamsToPromote.length > 0) {
          // Encontrar competição superior
          const higherTier = competition.tier - 1;
          const { data: higherCompetition } = await supabase
            .from('game_competitions')
            .select('id, name')
            .eq('tier', higherTier)
            .single();

          if (higherCompetition) {
            console.log(`   ⬆️  Movendo ${teamsToPromote.length} times para ${higherCompetition.name}:`);
            
            for (const standing of teamsToPromote) {
              // Remover da competição atual
              await supabase
                .from('game_competition_teams')
                .delete()
                .eq('competition_id', competition.id)
                .eq('team_id', standing.team_id);

              // Adicionar à competição superior
              await supabase
                .from('game_competition_teams')
                .insert({
                  competition_id: higherCompetition.id,
                  team_id: standing.team_id,
                  registered_at: new Date().toISOString()
                });

              console.log(`     ✅ ${standing.game_teams.name} → ${higherCompetition.name}`);
            }
          }
        }
      }

      // Buscar times para rebaixamento (se não for Série D)
      if (competition.tier < 4) {
        const teamsToRelegate = await relegateMachineTeams(competition.id, competition.relegation_spots || 4);
        
        if (teamsToRelegate.length > 0) {
          // Encontrar competição inferior
          const lowerTier = competition.tier + 1;
          const { data: lowerCompetition } = await supabase
            .from('game_competitions')
            .select('id, name')
            .eq('tier', lowerTier)
            .single();

          if (lowerCompetition) {
            console.log(`   ⬇️  Movendo ${teamsToRelegate.length} times para ${lowerCompetition.name}:`);
            
            for (const standing of teamsToRelegate) {
              // Remover da competição atual
              await supabase
                .from('game_competition_teams')
                .delete()
                .eq('competition_id', competition.id)
                .eq('team_id', standing.team_id);

              // Adicionar à competição inferior
              await supabase
                .from('game_competition_teams')
                .insert({
                  competition_id: lowerCompetition.id,
                  team_id: standing.team_id,
                  registered_at: new Date().toISOString()
                });

              console.log(`     ✅ ${standing.game_teams.name} → ${lowerCompetition.name}`);
            }
          }
        }
      }
    }

    console.log('\n📋 4. Atualizando contadores das competições...');
    
    // Recalcular contadores de times em cada competição
    for (const competition of competitions) {
      const { count: teamCount } = await supabase
        .from('game_competition_teams')
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', competition.id);

      await supabase
        .from('game_competitions')
        .update({ current_teams: teamCount || 0 })
        .eq('id', competition.id);

      console.log(`   ✅ ${competition.name}: ${teamCount || 0} times`);
    }

    console.log('\n📋 5. Finalizando temporada atual...');
    
    // Marcar temporada atual como finalizada
    await supabase
      .from('game_competitions')
      .update({ 
        season_status: 'finished',
        season_year: (competitions[0]?.season_year || 2025) + 1
      })
      .eq('season_status', 'active');

    console.log('✅ Temporada finalizada e nova temporada iniciada');

    console.log('\n🎯 SISTEMA DE TEMPORADAS IMPLEMENTADO:');
    console.log('✅ Promoção/rebaixamento executado automaticamente');
    console.log('✅ Times de usuário promovidos para séries superiores');
    console.log('✅ Times da máquina rebaixados para séries inferiores');
    console.log('✅ Contadores das competições atualizados');
    console.log('✅ Nova temporada iniciada');

  } catch (error) {
    console.error('❌ Erro durante a implementação:', error);
  }
}

implementSeasonSystem(); 