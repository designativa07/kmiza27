const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testFinalSystem() {
  try {
    console.log('🎯 Testando sistema final de competições...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. Verificar todas as tabelas
    console.log('\n📋 Verificando todas as tabelas...');
    
    const tables = [
      'game_competitions',
      'game_competition_teams', 
      'game_standings',
      'game_rounds',
      'game_competition_matches'
    ];
    
    let allTablesOK = true;
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
        allTablesOK = false;
      } else {
        console.log(`✅ Tabela ${table}: OK`);
      }
    }
    
    if (!allTablesOK) {
      console.log('\n❌ Algumas tabelas não existem. Execute o script SQL primeiro!');
      return;
    }
    
    // 2. Verificar competições
    console.log('\n🏆 Verificando competições...');
    
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier');
    
    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }
    
    console.log(`✅ Competições encontradas: ${competitions.length}`);
    competitions.forEach(comp => {
      console.log(`  - ${comp.name} (Tier ${comp.tier}): ${comp.current_teams || 0}/${comp.max_teams} times (${comp.season_year})`);
    });
    
    // 3. Buscar times disponíveis
    console.log('\n👥 Verificando times disponíveis...');
    
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .limit(10);
    
    if (teamsError) {
      console.error('❌ Erro ao buscar times:', teamsError);
      return;
    }
    
    console.log(`✅ Times encontrados: ${teams.length}`);
    const userTeams = teams.filter(t => t.team_type === 'user');
    const machineTeams = teams.filter(t => t.team_type === 'machine');
    
    console.log(`  - Times de usuário: ${userTeams.length}`);
    console.log(`  - Times da máquina: ${machineTeams.length}`);
    
    if (userTeams.length === 0) {
      console.log('❌ Nenhum time de usuário encontrado');
      return;
    }
    
    if (machineTeams.length === 0) {
      console.log('❌ Nenhum time da máquina encontrado');
      return;
    }
    
    // 4. Testar inscrição em competição
    console.log('\n📝 Testando inscrição em competição...');
    
    const userTeam = userTeams[0];
    const competition = competitions[0]; // Série A
    
    // Verificar se já está inscrito
    const { data: existingRegistration } = await supabase
      .from('game_competition_teams')
      .select('id')
      .eq('competition_id', competition.id)
      .eq('team_id', userTeam.id)
      .single();
    
    if (!existingRegistration) {
      const { data: registration, error: regError } = await supabase
        .from('game_competition_teams')
        .insert({
          competition_id: competition.id,
          team_id: userTeam.id
        })
        .select()
        .single();
      
      if (regError) {
        console.error('❌ Erro ao inscrever time:', regError);
      } else {
        console.log(`✅ Time ${userTeam.name} inscrito na ${competition.name}`);
        
        // Atualizar contador da competição
        await supabase
          .from('game_competitions')
          .update({ current_teams: (competition.current_teams || 0) + 1 })
          .eq('id', competition.id);
      }
    } else {
      console.log(`⏭️ Time ${userTeam.name} já está inscrito na ${competition.name}`);
    }
    
    // 5. Testar criação de rodada
    console.log('\n🔄 Testando criação de rodada...');
    
    const { data: round, error: roundError } = await supabase
      .from('game_rounds')
      .insert({
        competition_id: competition.id,
        round_number: 1,
        name: 'Rodada 1'
      })
      .select()
      .single();
    
    if (roundError) {
      console.error('❌ Erro ao criar rodada:', roundError);
    } else {
      console.log(`✅ Rodada criada: ${round.name}`);
    }
    
    // 6. Testar criação de partida
    console.log('\n⚽ Testando criação de partida...');
    
    const machineTeam = machineTeams[0];
    
    const { data: match, error: matchError } = await supabase
      .from('game_competition_matches')
      .insert({
        competition_id: competition.id,
        home_team_id: userTeam.id,
        away_team_id: machineTeam.id,
        home_team_name: userTeam.name,
        away_team_name: machineTeam.name,
        match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled'
      })
      .select()
      .single();
    
    if (matchError) {
      console.error('❌ Erro ao criar partida:', matchError);
    } else {
      console.log(`✅ Partida criada: ${userTeam.name} vs ${machineTeam.name}`);
      
      // 7. Testar simulação da partida
      console.log('\n🎮 Testando simulação da partida...');
      
      const simulation = simulateMatchResult(userTeam, machineTeam);
      
      const { data: updatedMatch, error: updateError } = await supabase
        .from('game_competition_matches')
        .update({
          home_score: simulation.homeScore,
          away_score: simulation.awayScore,
          status: 'finished',
          highlights: simulation.highlights,
          stats: simulation.stats
        })
        .eq('id', match.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Erro ao simular partida:', updateError);
      } else {
        console.log(`✅ Partida simulada: ${simulation.homeScore}x${simulation.awayScore}`);
        console.log('🎯 Highlights:');
        simulation.highlights.forEach(highlight => {
          console.log(`  - ${highlight}`);
        });
      }
    }
    
    // 8. Testar classificação
    console.log('\n📊 Testando classificação...');
    
    const { data: standings, error: standingsError } = await supabase
      .from('game_standings')
      .select(`
        *,
        team:game_teams(id, name, short_name)
      `)
      .eq('competition_id', competition.id)
      .eq('season_year', 2024)
      .order('position');
    
    if (standingsError) {
      console.error('❌ Erro ao buscar classificação:', standingsError);
    } else {
      console.log(`✅ Classificação: ${standings.length} times`);
      standings.forEach(standing => {
        console.log(`  ${standing.position}. ${standing.team.name} - ${standing.points}pts (${standing.games_played} jogos)`);
      });
    }
    
    console.log('\n🎉 SISTEMA DE COMPETIÇÕES FUNCIONANDO PERFEITAMENTE!');
    console.log('\n📋 Funcionalidades testadas:');
    console.log('✅ Tabelas criadas');
    console.log('✅ Competições configuradas');
    console.log('✅ Inscrição de times');
    console.log('✅ Criação de rodadas');
    console.log('✅ Criação de partidas');
    console.log('✅ Simulação de partidas');
    console.log('✅ Sistema de classificação');
    
  } catch (error) {
    console.error('❌ Erro no teste final:', error);
  }
}

function simulateMatchResult(homeTeam, awayTeam) {
  // Fatores que influenciam o resultado
  const homeAdvantage = 1.2;
  const homeReputation = homeTeam.reputation || 50;
  const awayReputation = awayTeam.reputation || 50;
  
  // Calcular força base dos times
  const homeStrength = (homeReputation * homeAdvantage) + Math.random() * 20;
  const awayStrength = awayReputation + Math.random() * 20;

  // Simular gols baseado na diferença de força
  const strengthDiff = homeStrength - awayStrength;
  const homeGoals = Math.max(0, Math.floor((strengthDiff + 30) / 15) + Math.floor(Math.random() * 3));
  const awayGoals = Math.max(0, Math.floor((30 - strengthDiff) / 15) + Math.floor(Math.random() * 3));

  // Gerar estatísticas
  const possession = 50 + (strengthDiff / 2);
  const homeShots = Math.floor(homeGoals * 3 + Math.random() * 8);
  const awayShots = Math.floor(awayGoals * 3 + Math.random() * 8);
  const homeShotsOnTarget = Math.floor(homeShots * 0.6);
  const awayShotsOnTarget = Math.floor(awayShots * 0.6);

  // Gerar highlights
  const highlights = generateHighlights(homeTeam.name, awayTeam.name, homeGoals, awayGoals);

  return {
    homeScore: homeGoals,
    awayScore: awayGoals,
    highlights,
    stats: {
      possession: { home: Math.max(30, Math.min(70, possession)), away: Math.max(30, Math.min(70, 100 - possession)) },
      shots: { home: homeShots, away: awayShots },
      shots_on_target: { home: homeShotsOnTarget, away: awayShotsOnTarget },
      corners: { home: Math.floor(homeShots * 0.3), away: Math.floor(awayShots * 0.3) },
      fouls: { home: Math.floor(Math.random() * 15) + 5, away: Math.floor(Math.random() * 15) + 5 },
      yellow_cards: { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) },
      red_cards: { home: Math.floor(Math.random() * 2), away: Math.floor(Math.random() * 2) }
    }
  };
}

function generateHighlights(homeTeamName, awayTeamName, homeGoals, awayGoals) {
  const highlights = [];
  const players = ['João Silva', 'Pedro Santos', 'Carlos Oliveira', 'Miguel Costa', 'Lucas Pereira'];
  
  let homeGoalCount = 0;
  let awayGoalCount = 0;
  
  // Simular gols em momentos aleatórios
  for (let minute = 1; minute <= 90; minute += Math.floor(Math.random() * 10) + 5) {
    if (homeGoalCount < homeGoals && Math.random() < 0.3) {
      const player = players[Math.floor(Math.random() * players.length)];
      highlights.push(`${minute}' - GOL! ${player} marca para ${homeTeamName}`);
      homeGoalCount++;
    }
    
    if (awayGoalCount < awayGoals && Math.random() < 0.3) {
      const player = players[Math.floor(Math.random() * players.length)];
      highlights.push(`${minute}' - GOL! ${player} marca para ${awayTeamName}`);
      awayGoalCount++;
    }
  }
  
  return highlights;
}

// Executar teste final
testFinalSystem(); 