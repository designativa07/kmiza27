const { getSupabaseServiceClient } = require('../config/supabase-connection');

/**
 * Script para corrigir todas as rodadas já jogadas pelo usuário
 * Simula as partidas entre times da máquina para manter sincronização
 */
async function fixAllPlayedRounds() {
  try {
    console.log('🔧 CORRIGINDO TODAS AS RODADAS JÁ JOGADAS');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. VERIFICAR USUÁRIO PALHOCA
    console.log('\n👤 1. Verificando usuário PALHOCA...');
    const { data: palhocaTeam, error: palhocaError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('name', 'PALHOCA')
      .single();
    
    if (palhocaError) {
      console.log('❌ Erro ao buscar time PALHOCA:', palhocaError);
      return;
    }
    
    console.log(`✅ Time PALHOCA encontrado: ${palhocaTeam.name}`);
    
    // 2. VERIFICAR QUAIS RODADAS JÁ FORAM JOGADAS
    console.log('\n📅 2. Verificando rodadas já jogadas...');
    const { data: playedMatches, error: matchesError } = await supabase
      .from('game_season_matches')
      .select('round_number, season_year, tier')
      .eq('user_id', palhocaTeam.owner_id)
      .eq('season_year', 2025)
      .eq('status', 'finished')
      .order('round_number', { ascending: true });
    
    if (matchesError) {
      console.log('❌ Erro ao buscar partidas jogadas:', matchesError);
      return;
    }
    
    const playedRounds = [...new Set(playedMatches.map(m => m.round_number))];
    console.log(`✅ Rodadas jogadas: ${playedRounds.join(', ')}`);
    
    if (playedRounds.length === 0) {
      console.log('ℹ️ Usuário ainda não jogou nenhuma partida');
      return;
    }
    
    // 3. VERIFICAR QUAIS RODADAS JÁ FORAM SIMULADAS PARA TIMES DA MÁQUINA
    console.log('\n🤖 3. Verificando rodadas já simuladas para times da máquina...');
    const { data: machineMatches, error: machineError } = await supabase
      .from('game_season_matches')
      .select('round_number')
      .eq('user_id', palhocaTeam.owner_id)
      .eq('season_year', 2025)
      .not('home_machine_team_id', 'is', null)
      .not('away_machine_team_id', 'is', null)
      .eq('status', 'finished')
      .order('round_number', { ascending: true });
    
    if (machineError) {
      console.log('❌ Erro ao buscar partidas da máquina:', machineError);
      return;
    }
    
    const simulatedRounds = [...new Set(machineMatches.map(m => m.round_number))];
    console.log(`✅ Rodadas já simuladas para times da máquina: ${simulatedRounds.join(', ')}`);
    
    // 4. IDENTIFICAR RODADAS QUE PRECISAM SER SIMULADAS
    const roundsToSimulate = playedRounds.filter(round => !simulatedRounds.includes(round));
    console.log(`\n🔄 Rodadas que precisam ser simuladas: ${roundsToSimulate.join(', ')}`);
    
    if (roundsToSimulate.length === 0) {
      console.log('✅ Todas as rodadas já foram simuladas para times da máquina!');
      return;
    }
    
    // 5. SIMULAR CADA RODADA PENDENTE
    console.log('\n🎮 5. Simulando rodadas pendentes...');
    for (const round of roundsToSimulate) {
      console.log(`\n   🎯 Simulando rodada ${round}...`);
      await simulateRoundForMachineTeams(supabase, palhocaTeam.owner_id, round, 2025, 4);
    }
    
    // 6. VERIFICAR RESULTADO FINAL
    console.log('\n📊 6. Verificando resultado final...');
    const { data: finalStats, error: statsError } = await supabase
      .from('game_user_machine_team_stats')
      .select('*')
      .eq('user_id', palhocaTeam.owner_id)
      .eq('season_year', 2025)
      .eq('tier', 4)
      .order('points', { ascending: false })
      .limit(5);
    
    if (statsError) {
      console.log('❌ Erro ao buscar estatísticas finais:', statsError);
    } else {
      console.log(`✅ Top 5 times da máquina após correção:`);
      finalStats.forEach((stat, index) => {
        const teamName = stat.team_name || `Time ${stat.team_id.slice(0, 8)}`;
        console.log(`   ${index + 1}. ${teamName}: ${stat.points} pts, ${stat.games_played} jogos`);
      });
    }
    
    console.log('\n🎉 CORREÇÃO COMPLETA! Todas as rodadas jogadas agora têm times da máquina simulados.');
    
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
      console.log(`      ${match.homeTeam.name} ${result.homeGoals}x${result.awayGoals} ${match.awayTeam.name}`);
      
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
  const homeStrength = (homeTeam.attributes?.overall || 70) + 3; // Bônus de casa
  const awayStrength = awayTeam.attributes?.overall || 70;
  
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
  fixAllPlayedRounds()
    .then(() => {
      console.log('\n✅ Script de correção executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { fixAllPlayedRounds };
