const { getSupabaseClient } = require('../config/supabase-connection');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('🎮 CORREÇÃO: Implementando sistema de pontuação dos times da máquina');
  
  const supabase = getSupabaseClient('vps');
  
  try {
    // 1. Criar tabela de estatísticas dos times da máquina
    console.log('📋 Passo 1: Criando tabela game_machine_team_stats...');
    
    const sqlPath = path.join(__dirname, '../database/add-machine-team-stats-table.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');
    
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (sqlError) {
      console.error('❌ Erro ao executar SQL:', sqlError);
      // Continuar mesmo com erro - a tabela pode já existir
    } else {
      console.log('✅ Tabela criada com sucesso');
    }
    
    // 2. Buscar todos os usuários com temporadas ativas
    console.log('📋 Passo 2: Buscando usuários com temporadas ativas...');
    
    const { data: activeUsers, error: usersError } = await supabase
      .from('game_user_competition_progress')
      .select('user_id, current_tier, season_year, games_played')
      .eq('season_status', 'active');
    
    if (usersError) {
      throw new Error(`Erro ao buscar usuários: ${usersError.message}`);
    }
    
    console.log(`📊 Encontrados ${activeUsers.length} usuários com temporadas ativas`);
    
    // 3. Para cada usuário, simular as rodadas já jogadas
    for (const user of activeUsers) {
      console.log(`🎯 Processando usuário ${user.user_id} - Série ${getTierName(user.current_tier)}`);
      
      // Buscar rodadas já finalizadas pelo usuário
      const { data: finishedMatches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('round_number')
        .eq('user_id', user.user_id)
        .eq('season_year', user.season_year)
        .eq('tier', user.current_tier)
        .in('status', ['finished', 'simulated'])
        .order('round_number');
      
      if (matchesError) {
        console.error(`❌ Erro ao buscar partidas do usuário ${user.user_id}:`, matchesError);
        continue;
      }
      
      const finishedRounds = finishedMatches.map(m => m.round_number);
      console.log(`   - Rodadas finalizadas: ${finishedRounds.join(', ')}`);
      
      // Simular cada rodada finalizada para os times da máquina
      for (const round of finishedRounds) {
        await simulateRoundForMachineTeams(supabase, user.user_id, round, user.season_year, user.current_tier);
      }
      
      console.log(`✅ Usuário ${user.user_id} processado`);
    }
    
    // 4. Verificar resultados
    console.log('📋 Passo 3: Verificando resultados...');
    
    const { data: statsCount, error: countError } = await supabase
      .from('game_machine_team_stats')
      .select('tier, count(*)', { count: 'exact' })
      .neq('games_played', 0);
    
    if (!countError) {
      console.log('📊 Times da máquina com partidas simuladas:');
      for (const stat of statsCount || []) {
        console.log(`   - Série ${getTierName(stat.tier)}: ${stat.count} times com estatísticas`);
      }
    }
    
    console.log('🎉 CORREÇÃO CONCLUÍDA! Os times da máquina agora devem pontuar corretamente.');
    console.log('💡 Recarregue a página no frontend para ver as estatísticas atualizadas.');
    
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
    console.log(`    🎮 Simulando rodada ${roundNumber} para times da máquina...`);
    
    // 1. Buscar times da máquina da série
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('*')
      .eq('tier', tier)
      .eq('is_active', true)
      .order('display_order');
    
    if (teamsError || !machineTeams || machineTeams.length < 19) {
      console.log(`    ⚠️ Série ${getTierName(tier)} tem apenas ${machineTeams?.length || 0} times, esperado 19`);
      return;
    }
    
    // 2. Gerar partidas da rodada
    const matches = generateMachineMatchesForRound(machineTeams, roundNumber);
    
    // 3. Simular cada partida
    for (const match of matches) {
      const result = simulateMachineVsMachine(match.homeTeam, match.awayTeam);
      
      // Atualizar estatísticas
      await updateMachineTeamStats(supabase, match.homeTeam.id, result.homeGoals, result.awayGoals, seasonYear, tier);
      await updateMachineTeamStats(supabase, match.awayTeam.id, result.awayGoals, result.homeGoals, seasonYear, tier);
    }
    
    console.log(`    ✅ Rodada ${roundNumber} simulada - ${matches.length} partidas`);
    
  } catch (error) {
    console.error(`    ❌ Erro ao simular rodada ${roundNumber}:`, error);
  }
}

/**
 * Gera partidas entre times da máquina para uma rodada
 */
function generateMachineMatchesForRound(machineTeams, roundNumber) {
  const matches = [];
  const teamsCount = machineTeams.length;
  const offset = roundNumber % teamsCount;
  
  for (let i = 0; i < Math.floor(teamsCount / 2); i++) {
    const homeIndex = (i + offset) % teamsCount;
    const awayIndex = (teamsCount - 1 - i + offset) % teamsCount;
    
    if (homeIndex !== awayIndex) {
      matches.push({
        homeTeam: machineTeams[homeIndex],
        awayTeam: machineTeams[awayIndex]
      });
    }
  }
  
  return matches;
}

/**
 * Simula partida entre dois times da máquina
 */
function simulateMachineVsMachine(homeTeam, awayTeam) {
  // Calcular força dos times
  const homeAttrs = homeTeam.attributes || {};
  const awayAttrs = awayTeam.attributes || {};
  
  const homeStrength = (homeAttrs.overall || 50) + 3; // bônus de casa
  const awayStrength = awayAttrs.overall || 50;
  
  // Diferença de força
  const strengthDiff = homeStrength - awayStrength;
  
  // Probabilidades
  let homeWinChance = 40 + (strengthDiff * 2);
  let drawChance = 30;
  
  homeWinChance = Math.max(15, Math.min(70, homeWinChance));
  
  // Sorteio
  const random = Math.random() * 100;
  let homeGoals, awayGoals;
  
  if (random < homeWinChance) {
    // Vitória casa
    homeGoals = 1 + Math.floor(Math.random() * 3);
    awayGoals = Math.floor(Math.random() * homeGoals);
  } else if (random < homeWinChance + drawChance) {
    // Empate
    const goals = Math.floor(Math.random() * 4);
    homeGoals = goals;
    awayGoals = goals;
  } else {
    // Vitória fora
    awayGoals = 1 + Math.floor(Math.random() * 3);
    homeGoals = Math.floor(Math.random() * awayGoals);
  }
  
  return { homeGoals, awayGoals };
}

/**
 * Atualiza estatísticas de um time da máquina
 */
async function updateMachineTeamStats(supabase, teamId, goalsFor, goalsAgainst, seasonYear, tier) {
  try {
    // Calcular resultado
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
      .from('game_machine_team_stats')
      .select('*')
      .eq('team_id', teamId)
      .eq('season_year', seasonYear)
      .eq('tier', tier)
      .single();
    
    if (currentStats) {
      // Atualizar
      await supabase
        .from('game_machine_team_stats')
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
        .eq('team_id', teamId)
        .eq('season_year', seasonYear)
        .eq('tier', tier);
    } else {
      // Criar novo
      await supabase
        .from('game_machine_team_stats')
        .insert({
          team_id: teamId,
          season_year: seasonYear,
          tier: tier,
          games_played: 1,
          wins: wins,
          draws: draws,
          losses: losses,
          goals_for: goalsFor,
          goals_against: goalsAgainst,
          points: points
        });
    }
    
  } catch (error) {
    console.error(`Erro ao atualizar stats do time ${teamId}:`, error);
  }
}

/**
 * Converte tier numérico para nome da série
 */
function getTierName(tier) {
  const names = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return names[tier] || tier;
}

// Executar script
if (require.main === module) {
  main();
}

module.exports = { main };