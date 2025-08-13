const { getSupabaseServiceClient } = require('../config/supabase-connection');

/**
 * Script para corrigir simulação automática dos times da máquina
 * Garante que quando o usuário joga, os times da máquina também joguem todas as rodadas
 */
async function fixMachineTeamsSimulation() {
  try {
    console.log('🔧 CORRIGINDO SIMULAÇÃO AUTOMÁTICA DOS TIMES DA MÁQUINA');
    console.log('=' .repeat(70));
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. VERIFICAR USUÁRIOS ATIVOS
    console.log('\n👥 1. Verificando usuários ativos...');
    const { data: users, error: usersError } = await supabase
      .from('game_teams')
      .select('owner_id, name, id')
      .eq('team_type', 'user_created');
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log(`✅ Encontrados ${users.length} usuários ativos`);
    
    // 2. PARA CADA USUÁRIO, VERIFICAR E CORRIGIR SIMULAÇÃO
    for (const user of users) {
      console.log(`\n🎯 Processando usuário: ${user.name} (${user.owner_id})`);
      
             // Buscar temporada ativa do usuário
       const { data: userProgress, error: progressError } = await supabase
         .from('game_user_competition_progress')
         .select('*')
         .eq('user_id', user.owner_id)
         .eq('season_status', 'active')
         .order('created_at', { ascending: false })
         .limit(1);
      
      if (progressError || !userProgress || userProgress.length === 0) {
        console.log(`   ⚠️ Usuário ${user.name} não tem progresso ativo`);
        continue;
      }
      
             const progress = userProgress[0];
       const tier = progress.current_tier || progress.tier;
       console.log(`   📊 Temporada: ${progress.season_year}, Série: ${tier}, Jogos: ${progress.games_played}/38`);
      
      // 3. VERIFICAR QUAIS RODADAS JÁ FORAM SIMULADAS
      const { data: userMatches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('round_number, status')
        .eq('user_id', user.owner_id)
        .eq('season_year', progress.season_year)
        .eq('status', 'finished')
        .order('round_number', { ascending: true });
      
      if (matchesError) {
        console.log(`   ❌ Erro ao buscar partidas do usuário:`, matchesError);
        continue;
      }
      
      const playedRounds = userMatches?.map(m => m.round_number) || [];
      console.log(`   🎮 Rodadas jogadas pelo usuário: ${playedRounds.join(', ')}`);
      
      if (playedRounds.length === 0) {
        console.log(`   ℹ️ Usuário ainda não jogou nenhuma partida`);
        continue;
      }
      
      const lastPlayedRound = Math.max(...playedRounds);
      console.log(`   🏁 Última rodada jogada: ${lastPlayedRound}`);
      
      // 4. VERIFICAR QUAIS RODADAS JÁ FORAM SIMULADAS ENTRE TIMES DA MÁQUINA
      const { data: machineMatches, error: machineError } = await supabase
        .from('game_season_matches')
        .select('round_number, status')
        .eq('user_id', user.owner_id)
        .eq('season_year', progress.season_year)
        .not('home_machine_team_id', 'is', null)
        .not('away_machine_team_id', 'is', null)
        .eq('status', 'finished')
        .order('round_number', { ascending: true });
      
      if (machineError) {
        console.log(`   ❌ Erro ao buscar partidas da máquina:`, machineError);
        continue;
      }
      
      const simulatedRounds = machineMatches?.map(m => m.round_number) || [];
      console.log(`   🤖 Rodadas simuladas entre times da máquina: ${simulatedRounds.join(', ')}`);
      
      // 5. IDENTIFICAR RODADAS QUE PRECISAM SER SIMULADAS
      const roundsToSimulate = [];
      for (let round = 1; round <= lastPlayedRound; round++) {
        if (!simulatedRounds.includes(round)) {
          roundsToSimulate.push(round);
        }
      }
      
      if (roundsToSimulate.length === 0) {
        console.log(`   ✅ Todas as rodadas até ${lastPlayedRound} já foram simuladas`);
        continue;
      }
      
      console.log(`   🔄 Rodadas que precisam ser simuladas: ${roundsToSimulate.join(', ')}`);
      
      // 6. SIMULAR RODADAS PENDENTES
      for (const round of roundsToSimulate) {
        console.log(`   🎮 Simulando rodada ${round}...`);
        await simulateRoundForMachineTeams(supabase, user.owner_id, round, progress.season_year, tier);
      }
      
      console.log(`   ✅ Usuário ${user.name} processado com sucesso`);
    }
    
    console.log('\n🎉 CORREÇÃO COMPLETA! Todos os times da máquina agora devem ter estatísticas atualizadas.');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    process.exit(1);
  }
}

/**
 * Simula uma rodada completa para os times da máquina
 */
async function simulateRoundForMachineTeams(supabase, userId, roundNumber, seasonYear, tier) {
  try {
    // 1. Buscar times da máquina da série
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('*')
      .eq('tier', tier)
      .eq('is_active', true)
      .order('display_order');
    
    if (teamsError || !machineTeams || machineTeams.length < 19) {
      console.log(`      ⚠️ Série tem apenas ${machineTeams?.length || 0} times, esperado 19`);
      return;
    }
    
    // 2. Gerar partidas da rodada
    const matches = generateMachineMatchesForRound(machineTeams, roundNumber);
    
    // 3. Simular cada partida
    for (const match of matches) {
      const result = simulateMachineVsMachine(match.homeTeam, match.awayTeam);
      
      // Atualizar estatísticas
      await updateMachineTeamStats(supabase, match.homeTeam.id, result.homeGoals, result.awayGoals, seasonYear, tier, userId);
      await updateMachineTeamStats(supabase, match.awayTeam.id, result.awayGoals, result.homeGoals, seasonYear, tier, userId);
    }
    
    console.log(`      ✅ Rodada ${roundNumber} simulada - ${matches.length} partidas`);
    
  } catch (error) {
    console.error(`      ❌ Erro ao simular rodada ${roundNumber}:`, error);
  }
}

/**
 * Gera partidas entre times da máquina para uma rodada
 */
function generateMachineMatchesForRound(machineTeams, roundNumber) {
  const matches = [];
  const teamsCount = machineTeams.length;
  
  if (teamsCount !== 19) {
    return matches;
  }
  
  // Com 19 times: cada rodada 1 time descansa, 18 jogam (9 partidas)
  const isReturno = roundNumber > 19;
  const actualRound = isReturno ? roundNumber - 19 : roundNumber;
  
  // Determinar qual time descansa nesta rodada
  const restingTeamIndex = (actualRound - 1) % teamsCount;
  
  // Times que jogam (todos exceto o que descansa)
  const playingTeams = machineTeams.filter((_, index) => index !== restingTeamIndex);
  
  // Gerar exatamente 9 partidas com os 18 times
  for (let i = 0; i < 9; i++) {
    let homeTeam = playingTeams[i];
    let awayTeam = playingTeams[17 - i];
    
    // No returno, inverter mando de campo
    if (isReturno) {
      [homeTeam, awayTeam] = [awayTeam, homeTeam];
    }
    
    matches.push({
      homeTeam: homeTeam,
      awayTeam: awayTeam
    });
  }
  
  return matches;
}

/**
 * Simula partida entre dois times da máquina
 */
function simulateMachineVsMachine(homeTeam, awayTeam) {
  // Calcular força dos times
  const homeStrength = (homeTeam.overall_rating || 70) + 3; // Bônus de casa
  const awayStrength = awayTeam.overall_rating || 70;
  
  // Diferença de força
  const strengthDiff = homeStrength - awayStrength;
  
  // Probabilidades baseadas na diferença
  let homeWinChance = 40 + (strengthDiff * 2);
  let drawChance = 30;
  let awayWinChance = 100 - homeWinChance - drawChance;
  
  // Limitar probabilidades
  homeWinChance = Math.max(15, Math.min(70, homeWinChance));
  awayWinChance = Math.max(15, 100 - homeWinChance - drawChance);
  
  // Sorteio do resultado
  const random = Math.random() * 100;
  let homeGoals, awayGoals;
  
  if (random < homeWinChance) {
    // Vitória do mandante
    homeGoals = 1 + Math.floor(Math.random() * 3);
    awayGoals = Math.floor(Math.random() * homeGoals);
  } else if (random < homeWinChance + drawChance) {
    // Empate
    const goals = Math.floor(Math.random() * 4);
    homeGoals = goals;
    awayGoals = goals;
  } else {
    // Vitória do visitante
    awayGoals = 1 + Math.floor(Math.random() * 3);
    homeGoals = Math.floor(Math.random() * awayGoals);
  }
  
  return { homeGoals, awayGoals };
}

/**
 * Atualiza estatísticas de um time da máquina
 */
async function updateMachineTeamStats(supabase, teamId, goalsFor, goalsAgainst, seasonYear, tier, userId) {
  try {
    // Determinar resultado (W/D/L)
    let wins = 0, draws = 0, losses = 0, points = 0;
    
    if (goalsFor > goalsAgainst) {
      wins = 1;
      points = 3;
    } else if (goalsFor === goalsAgainst) {
      draws = 1;
      points = 1;
    } else {
      losses = 1;
      points = 0;
    }

    // Buscar estatísticas atuais
    const { data: currentStats, error: fetchError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('season_year', seasonYear)
      .eq('tier', tier)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.log(`      ❌ Erro ao buscar stats:`, fetchError);
      return;
    }

    if (currentStats) {
      // Atualizar estatísticas existentes
      const { error: updateError } = await supabase
        .from('game_user_machine_team_stats')
        .update({
          games_played: currentStats.games_played + 1,
          wins: currentStats.wins + wins,
          draws: currentStats.draws + draws,
          losses: currentStats.losses + losses,
          goals_for: currentStats.goals_for + goalsFor,
          goals_against: currentStats.goals_against + goalsAgainst,
          points: currentStats.points + points,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('season_year', seasonYear)
        .eq('tier', tier);

      if (updateError) {
        console.log(`      ❌ Erro ao atualizar stats:`, updateError);
      }
    } else {
      // Criar novas estatísticas
      const { error: insertError } = await supabase
        .from('game_user_machine_team_stats')
        .insert({
          user_id: userId,
          team_id: teamId,
          season_year: seasonYear,
          tier: tier,
          games_played: 1,
          wins: wins,
          draws: draws,
          losses: losses,
          goals_for: goalsFor,
          goals_against: goalsAgainst,
          points: points,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.log(`      ❌ Erro ao criar stats:`, insertError);
      }
    }
    
  } catch (error) {
    console.log(`      ❌ Erro ao atualizar estatísticas:`, error);
  }
}

// Executar o script
if (require.main === module) {
  fixMachineTeamsSimulation()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { fixMachineTeamsSimulation };
