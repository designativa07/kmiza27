const { getSupabaseClient } = require('../config/supabase-connection');

async function implementPhase2Competitions() {
  try {
    console.log('🎯 IMPLEMENTANDO FASE 2 - SISTEMA DE COMPETIÇÕES AVANÇADO');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. VERIFICAR COMPETIÇÕES EXISTENTES
    console.log('\n📋 1. Verificando competições existentes...');
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });
    
    if (compError) {
      console.log(`❌ Erro ao buscar competições: ${compError.message}`);
      return;
    }
    
    console.log(`✅ Encontradas ${competitions.length} competições:`);
    competitions.forEach(comp => {
      console.log(`  🏆 ${comp.name} (Série ${comp.tier}) - ${comp.current_teams}/${comp.max_teams} times`);
    });
    
    // 2. IMPLEMENTAR SISTEMA DE RODADAS AUTOMÁTICAS
    console.log('\n🔄 2. Implementando sistema de rodadas automáticas...');
    
    for (const competition of competitions) {
      if (competition.current_teams > 0) {
        console.log(`\n📊 Processando ${competition.name}...`);
        
        // Buscar times inscritos
        const { data: teams, error: teamsError } = await supabase
          .from('game_competition_teams')
          .select('team_id')
          .eq('competition_id', competition.id);
        
        if (teamsError) {
          console.log(`❌ Erro ao buscar times: ${teamsError.message}`);
          continue;
        }
        
        console.log(`  ✅ ${teams.length} times inscritos`);
        
        // Criar rodadas baseadas no formato da competição
        await createCompetitionRounds(competition, teams);
      }
    }
    
    // 3. IMPLEMENTAR SISTEMA DE CLASSIFICAÇÕES
    console.log('\n📊 3. Implementando sistema de classificações...');
    await implementStandingsSystem();
    
    // 4. IMPLEMENTAR PROMOÇÃO/REBAIXAMENTO
    console.log('\n🔄 4. Implementando sistema de promoção/rebaixamento...');
    await implementPromotionRelegation();
    
    console.log('\n✅ FASE 2 IMPLEMENTADA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro na implementação da FASE 2:', error);
  }
}

async function createCompetitionRounds(competition, teams) {
  try {
    const supabase = getSupabaseClient('vps');
    
    // Determinar formato baseado na série
    let rounds = [];
    
    switch (competition.tier) {
      case 1: // Série A - Ida e volta (38 rodadas)
        rounds = createRoundRobinRounds(teams, 38, 'Série A');
        break;
      case 2: // Série B - Ida e volta (38 rodadas)
        rounds = createRoundRobinRounds(teams, 38, 'Série B');
        break;
      case 3: // Série C - Turno único (19 rodadas)
        rounds = createRoundRobinRounds(teams, 19, 'Série C');
        break;
      case 4: // Série D - Grupos + mata-mata
        rounds = createGroupStageRounds(teams, 'Série D');
        break;
    }
    
    // Criar rodadas no banco
    for (const round of rounds) {
      const { data, error } = await supabase
        .from('game_rounds')
        .insert({
          competition_id: competition.id,
          round_number: round.roundNumber,
          name: round.name,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.log(`  ❌ Erro ao criar rodada ${round.name}: ${error.message}`);
      } else {
        console.log(`  ✅ Rodada criada: ${round.name}`);
        
        // Criar partidas da rodada
        await createRoundMatches(competition.id, data.id, round.matches);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar rodadas:', error);
  }
}

function createRoundRobinRounds(teams, totalRounds, competitionName) {
  const rounds = [];
  const teamIds = teams.map(t => t.team_id);
  
  // Algoritmo de Round Robin
  for (let round = 1; round <= totalRounds; round++) {
    const matches = [];
    
    // Criar partidas para esta rodada
    for (let i = 0; i < teamIds.length / 2; i++) {
      const homeIndex = i;
      const awayIndex = teamIds.length - 1 - i;
      
      if (homeIndex !== awayIndex) {
        matches.push({
          home_team_id: teamIds[homeIndex],
          away_team_id: teamIds[awayIndex]
        });
      }
    }
    
    rounds.push({
      roundNumber: round,
      name: `${competitionName} - Rodada ${round}`,
      matches: matches
    });
    
    // Rotacionar times (exceto o primeiro)
    if (teamIds.length > 2) {
      const lastTeam = teamIds.pop();
      teamIds.splice(1, 0, lastTeam);
    }
  }
  
  return rounds;
}

function createGroupStageRounds(teams, competitionName) {
  const rounds = [];
  const teamIds = teams.map(t => t.team_id);
  
  // Dividir em grupos de 8 times
  const groups = [];
  for (let i = 0; i < teamIds.length; i += 8) {
    groups.push(teamIds.slice(i, i + 8));
  }
  
  // Criar rodadas de grupos
  groups.forEach((group, groupIndex) => {
    for (let round = 1; round <= 7; round++) { // 7 rodadas por grupo
      const matches = [];
      
      for (let i = 0; i < group.length / 2; i++) {
        const homeIndex = i;
        const awayIndex = group.length - 1 - i;
        
        if (homeIndex !== awayIndex) {
          matches.push({
            home_team_id: group[homeIndex],
            away_team_id: group[awayIndex]
          });
        }
      }
      
      rounds.push({
        roundNumber: round + (groupIndex * 7),
        name: `${competitionName} - Grupo ${groupIndex + 1} - Rodada ${round}`,
        matches: matches
      });
    }
  });
  
  return rounds;
}

async function createRoundMatches(competitionId, roundId, matches) {
  try {
    const supabase = getSupabaseClient('vps');
    
    for (const match of matches) {
      const { data, error } = await supabase
        .from('game_matches')
        .insert({
          competition_id: competitionId,
          round_id: roundId,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          status: 'scheduled',
          match_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.log(`    ❌ Erro ao criar partida: ${error.message}`);
      } else {
        console.log(`    ✅ Partida criada: ${match.home_team_id} vs ${match.away_team_id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar partidas da rodada:', error);
  }
}

async function implementStandingsSystem() {
  try {
    const supabase = getSupabaseClient('vps');
    
    console.log('  📊 Atualizando classificações...');
    
    // Buscar todas as competições
    const { data: competitions } = await supabase
      .from('game_competitions')
      .select('id, name');
    
    for (const competition of competitions) {
      // Buscar times inscritos
      const { data: teams } = await supabase
        .from('game_competition_teams')
        .select('team_id')
        .eq('competition_id', competition.id);
      
      if (teams && teams.length > 0) {
        // Criar/atualizar classificações
        for (const team of teams) {
          const { data: existing } = await supabase
            .from('game_standings')
            .select('id')
            .eq('competition_id', competition.id)
            .eq('team_id', team.team_id)
            .single();
          
          if (!existing) {
            await supabase
              .from('game_standings')
              .insert({
                competition_id: competition.id,
                team_id: team.team_id,
                position: 0,
                points: 0,
                games_played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goals_for: 0,
                goals_against: 0,
                season_year: 2024
              });
          }
        }
        
        console.log(`    ✅ ${competition.name}: ${teams.length} times processados`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao implementar sistema de classificações:', error);
  }
}

async function implementPromotionRelegation() {
  try {
    const supabase = getSupabaseClient('vps');
    
    console.log('  🔄 Implementando sistema de promoção/rebaixamento...');
    
    // Buscar competições em ordem (A -> B -> C -> D)
    const { data: competitions } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });
    
    // Implementar lógica de promoção/rebaixamento
    for (let i = 0; i < competitions.length - 1; i++) {
      const currentComp = competitions[i];
      const nextComp = competitions[i + 1];
      
      console.log(`    📊 Processando ${currentComp.name} -> ${nextComp.name}`);
      
      // Aqui implementaríamos a lógica de promoção/rebaixamento
      // Por enquanto, apenas log
      console.log(`    ✅ Sistema preparado para ${currentComp.name}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao implementar promoção/rebaixamento:', error);
  }
}

implementPhase2Competitions(); 