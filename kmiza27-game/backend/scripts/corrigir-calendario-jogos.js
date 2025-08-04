const { getSupabaseClient } = require('../config/supabase-connection');

async function corrigirCalendarioJogos() {
  console.log('🔧 CORREÇÃO: Corrigindo calendário de jogos...\n');

  const supabase = getSupabaseClient('vps');

  try {
    // 1. Buscar competições ativas
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('status', 'active')
      .order('tier');

    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }

    console.log(`🏆 Encontradas ${competitions.length} competições ativas`);

    for (const competition of competitions) {
      console.log(`\n📋 Processando ${competition.name}...`);
      
      // Buscar times inscritos
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select(`
          team_id,
          game_teams!inner(name, team_type)
        `)
        .eq('competition_id', competition.id);

      if (teamsError) {
        console.log(`   ❌ Erro ao buscar times: ${teamsError.message}`);
        continue;
      }

      console.log(`   👥 ${enrolledTeams.length} times inscritos`);

      // Verificar se tem exatamente 20 times
      if (enrolledTeams.length !== 20) {
        console.log(`   ⚠️ AVISO: Competição tem ${enrolledTeams.length} times (esperado: 20)`);
        
        // Se tem menos que 20, completar com times da máquina
        if (enrolledTeams.length < 20) {
          await completarTimesCompetição(supabase, competition, enrolledTeams);
        }
      }

      // Verificar partidas existentes
      const { data: existingMatches, error: matchesError } = await supabase
        .from('game_matches')
        .select('id')
        .eq('competition_id', competition.id);

      if (matchesError) {
        console.log(`   ❌ Erro ao buscar partidas: ${matchesError.message}`);
        continue;
      }

      const expectedMatches = enrolledTeams.length * (enrolledTeams.length - 1); // Turno e returno
      
      console.log(`   ⚽ Partidas: ${existingMatches.length}/${expectedMatches}`);

      // Se faltam partidas, recriar calendário
      if (existingMatches.length < expectedMatches) {
        console.log(`   🔧 Recriando calendário...`);
        await recriarCalendarioCompeticao(supabase, competition.id, enrolledTeams);
      } else {
        console.log(`   ✅ Calendário está completo`);
      }
    }

    console.log('\n✅ Correção de calendário concluída!');

  } catch (error) {
    console.error('❌ Erro geral na correção:', error);
  }
}

async function completarTimesCompetição(supabase, competition, currentTeams) {
  try {
    const needed = 20 - currentTeams.length;
    console.log(`   🤖 Adicionando ${needed} times da máquina...`);

    // Buscar times da máquina da série correspondente que não estão inscritos
    const currentTeamIds = currentTeams.map(t => t.team_id);
    
    const { data: availableMachineTeams, error } = await supabase
      .from('game_machine_teams')
      .select('id')
      .eq('tier', competition.tier)
      .not('id', 'in', `(${currentTeamIds.join(',')})`)
      .limit(needed);

    if (error) {
      console.log(`   ❌ Erro ao buscar times da máquina: ${error.message}`);
      return;
    }

    if (availableMachineTeams.length < needed) {
      console.log(`   ⚠️ Só encontrei ${availableMachineTeams.length} times da máquina disponíveis`);
    }

    // Inscrever os times da máquina
    const enrollments = availableMachineTeams.map(team => ({
      competition_id: competition.id,
      team_id: team.id,
      enrolled_at: new Date().toISOString(),
      status: 'active'
    }));

    if (enrollments.length > 0) {
      const { error: enrollError } = await supabase
        .from('game_competition_teams')
        .insert(enrollments);

      if (enrollError) {
        console.log(`   ❌ Erro ao inscrever times: ${enrollError.message}`);
      } else {
        console.log(`   ✅ ${enrollments.length} times da máquina adicionados`);
      }
    }

  } catch (error) {
    console.error(`   ❌ Erro ao completar times:`, error);
  }
}

async function recriarCalendarioCompeticao(supabase, competitionId, teams) {
  try {
    // 1. Remover partidas existentes
    console.log(`   🗑️ Removendo partidas existentes...`);
    const { error: deleteError } = await supabase
      .from('game_matches')
      .delete()
      .eq('competition_id', competitionId);

    if (deleteError) {
      console.log(`   ❌ Erro ao remover partidas: ${deleteError.message}`);
      return;
    }

    // 2. Buscar rounds existentes
    const { data: rounds, error: roundsError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('competition_id', competitionId)
      .order('round_number');

    if (roundsError) {
      console.log(`   ❌ Erro ao buscar rounds: ${roundsError.message}`);
      return;
    }

    // Se não há rounds suficientes, criar
    const expectedRounds = (teams.length - 1) * 2; // Turno e returno
    if (rounds.length < expectedRounds) {
      console.log(`   📅 Criando ${expectedRounds - rounds.length} rounds...`);
      
      const newRounds = [];
      for (let i = rounds.length + 1; i <= expectedRounds; i++) {
        newRounds.push({
          competition_id: competitionId,
          round_number: i,
          name: `Rodada ${i}`
        });
      }

      const { data: createdRounds, error: createError } = await supabase
        .from('game_rounds')
        .insert(newRounds)
        .select();

      if (createError) {
        console.log(`   ❌ Erro ao criar rounds: ${createError.message}`);
        return;
      }

      rounds.push(...createdRounds);
    }

    // 3. Gerar partidas usando algoritmo correto de round-robin
    console.log(`   ⚽ Gerando partidas para ${teams.length} times...`);
    const matches = generateCorrectRoundRobinMatches(teams, competitionId, rounds);
    
    console.log(`   📊 Geradas ${matches.length} partidas`);

    // 4. Inserir partidas em lotes
    const batchSize = 20;
    let insertedCount = 0;
    
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('game_matches')
        .insert(batch);

      if (insertError) {
        console.log(`   ❌ Erro ao inserir lote: ${insertError.message}`);
        continue;
      }
      
      insertedCount += batch.length;
    }

    console.log(`   ✅ ${insertedCount} partidas inseridas com sucesso!`);

  } catch (error) {
    console.error(`   ❌ Erro ao recriar calendário:`, error);
  }
}

function generateCorrectRoundRobinMatches(teams, competitionId, rounds) {
  const matches = [];
  const teamIds = teams.map(t => t.team_id);
  const n = teamIds.length;
  
  if (n < 2) {
    return matches;
  }

  // Se número ímpar, adicionar "bye"
  let workingTeams = [...teamIds];
  if (n % 2 === 1) {
    workingTeams.push(null);
  }

  const numTeamsWorking = workingTeams.length;
  const numRounds = numTeamsWorking - 1;
  const halfSize = numTeamsWorking / 2;

  // TURNO (primeira metade das rodadas)
  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const team1 = workingTeams[i];
      const team2 = workingTeams[numTeamsWorking - 1 - i];
      
      if (team1 !== null && team2 !== null) {
        const roundData = rounds[round];
        
        matches.push({
          competition_id: competitionId,
          round_id: roundData.id,
          round_number: roundData.round_number,
          home_team_id: team1,
          away_team_id: team2,
          match_date: new Date(Date.now() + (round * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          status: 'scheduled',
          home_goals: null,
          away_goals: null,
          highlights: null
        });
      }
    }
    
    // Rotacionar times (exceto o primeiro)
    const temp = workingTeams[1];
    for (let i = 1; i < numTeamsWorking - 1; i++) {
      workingTeams[i] = workingTeams[i + 1];
    }
    workingTeams[numTeamsWorking - 1] = temp;
  }

  // RETURNO (segunda metade das rodadas)
  // Resetar teams para turno do returno
  workingTeams = [...teamIds];
  if (n % 2 === 1) {
    workingTeams.push(null);
  }

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const team1 = workingTeams[i];
      const team2 = workingTeams[numTeamsWorking - 1 - i];
      
      if (team1 !== null && team2 !== null) {
        const roundData = rounds[numRounds + round]; // Segunda metade dos rounds
        
        matches.push({
          competition_id: competitionId,
          round_id: roundData.id,
          round_number: roundData.round_number,
          home_team_id: team2, // Invertido para returno
          away_team_id: team1,
          match_date: new Date(Date.now() + ((numRounds + round) * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          status: 'scheduled',
          home_goals: null,
          away_goals: null,
          highlights: null
        });
      }
    }
    
    // Rotacionar times (exceto o primeiro)
    const temp = workingTeams[1];
    for (let i = 1; i < numTeamsWorking - 1; i++) {
      workingTeams[i] = workingTeams[i + 1];
    }
    workingTeams[numTeamsWorking - 1] = temp;
  }

  return matches;
}

// Executar se chamado diretamente
if (require.main === module) {
  corrigirCalendarioJogos()
    .then(() => {
      console.log('\n🏁 Correção finalizada!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { corrigirCalendarioJogos };