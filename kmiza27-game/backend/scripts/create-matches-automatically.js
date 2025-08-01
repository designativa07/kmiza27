const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('⚽ CRIANDO PARTIDAS AUTOMATICAMENTE');
console.log('=' .repeat(40));

async function createMatchesAutomatically() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Verificando competições ativas...');
    
    let { data: competitions, error } = await supabase
      .from('game_competitions')
      .select('id, name, tier, status, current_teams, max_teams')
      .eq('status', 'active')
      .order('tier', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar competições:', error);
      return;
    }

    if (!competitions || competitions.length === 0) {
      console.log('⚠️  Nenhuma competição ativa encontrada. Iniciando nova temporada...');
      
      // Iniciar nova temporada
      await supabase
        .from('game_competitions')
        .update({ 
          status: 'active',
          season_year: new Date().getFullYear()
        })
        .eq('status', 'finished');

      console.log('✅ Nova temporada iniciada');
      
      // Buscar competições novamente
      const { data: newCompetitions, error: newError } = await supabase
        .from('game_competitions')
        .select('id, name, tier, status, current_teams, max_teams')
        .eq('status', 'active')
        .order('tier', { ascending: true });

      if (newError) {
        console.error('❌ Erro ao buscar competições após iniciar temporada:', newError);
        return;
      }
      
      competitions = newCompetitions;
    }

    console.log('📊 Competições ativas encontradas:');
    competitions.forEach(comp => {
      console.log(`   - ${comp.name} (Tier ${comp.tier}): ${comp.current_teams}/${comp.max_teams} times`);
    });

    console.log('\n📋 2. Verificando times inscritos em cada competição...');
    
    for (const competition of competitions) {
      console.log(`\n🏆 Processando ${competition.name}:`);
      
      // Buscar times inscritos na competição
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select(`
          *,
          game_teams!inner(id, name, team_type)
        `)
        .eq('competition_id', competition.id);

      if (teamsError) {
        console.error(`❌ Erro ao buscar times da ${competition.name}:`, teamsError);
        continue;
      }

      console.log(`   📊 ${enrolledTeams.length} times inscritos:`);
      enrolledTeams.forEach(team => {
        console.log(`     - ${team.game_teams.name} (${team.game_teams.team_type})`);
      });

      // Verificar se já existem partidas para esta competição
      const { data: existingMatches, error: matchesError } = await supabase
        .from('game_matches')
        .select('id, home_team_name, away_team_name, match_date')
        .eq('competition_id', competition.id);

      if (matchesError) {
        console.error(`❌ Erro ao verificar partidas da ${competition.name}:`, matchesError);
        continue;
      }

      console.log(`   ⚽ ${existingMatches.length} partidas já existem`);

      // Se não há partidas e há times suficientes, criar calendário
      if (existingMatches.length === 0 && enrolledTeams.length >= 2) {
        console.log(`   🎯 Criando calendário de partidas para ${competition.name}...`);
        
        await createMatchSchedule(competition, enrolledTeams);
      } else if (existingMatches.length > 0) {
        console.log(`   ✅ Calendário já existe para ${competition.name}`);
      } else {
        console.log(`   ⚠️  Não há times suficientes para criar partidas em ${competition.name}`);
      }
    }

    console.log('\n🎯 SISTEMA DE CRIAÇÃO AUTOMÁTICA DE PARTIDAS:');
    console.log('✅ Verificação de competições ativas');
    console.log('✅ Início automático de nova temporada');
    console.log('✅ Criação de calendário de partidas');
    console.log('✅ Integração com sistema de competições');

  } catch (error) {
    console.error('❌ Erro durante a criação de partidas:', error);
  }
}

async function createMatchSchedule(competition, teams) {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log(`   📅 Criando calendário para ${teams.length} times...`);
    
    // Criar rodadas (turno e returno)
    const rounds = [];
    const totalRounds = (teams.length - 1) * 2; // Turno e returno
    
    for (let round = 1; round <= totalRounds; round++) {
      rounds.push({
        competition_id: competition.id,
        round_number: round,
        name: `Rodada ${round}`
      });
    }

    // Inserir rodadas
    const { data: createdRounds, error: roundsError } = await supabase
      .from('game_rounds')
      .insert(rounds)
      .select();

    if (roundsError) {
      console.error(`   ❌ Erro ao criar rodadas:`, roundsError);
      return;
    }

    console.log(`   ✅ ${createdRounds.length} rodadas criadas`);

    // Gerar partidas usando algoritmo de round-robin
    const matches = generateRoundRobinMatches(teams, competition.id, createdRounds);
    
    console.log(`   ⚽ Gerando ${matches.length} partidas...`);

    // Inserir partidas em lotes
    const batchSize = 10;
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('game_matches')
        .insert(batch);

      if (insertError) {
        console.error(`   ❌ Erro ao inserir lote de partidas:`, insertError);
        continue;
      }
    }

    console.log(`   ✅ ${matches.length} partidas criadas com sucesso!`);

  } catch (error) {
    console.error(`   ❌ Erro ao criar calendário:`, error);
  }
}

function generateRoundRobinMatches(teams, competitionId, rounds) {
  const matches = [];
  const teamIds = teams.map(team => team.game_teams.id);
  const teamNames = teams.map(team => team.game_teams.name);
  
  // Se número ímpar de times, adicionar "bye"
  if (teamIds.length % 2 !== 0) {
    teamIds.push(null);
    teamNames.push('BYE');
  }

  const n = teamIds.length;
  const totalRounds = n - 1;
  
  // Gerar partidas para turno e returno
  for (let round = 0; round < totalRounds * 2; round++) {
    const roundNumber = round + 1;
    const isReturnRound = round >= totalRounds;
    
    // Calcular partidas da rodada
    for (let i = 0; i < n / 2; i++) {
      const homeIndex = i;
      const awayIndex = n - 1 - i;
      
      // Pular partidas com "bye"
      if (teamIds[homeIndex] === null || teamIds[awayIndex] === null) {
        continue;
      }

      // Para returno, inverter mandante/visitante
      const actualHomeIndex = isReturnRound ? awayIndex : homeIndex;
      const actualAwayIndex = isReturnRound ? homeIndex : awayIndex;

      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + round * 7); // Uma semana entre rodadas

      matches.push({
        competition_id: competitionId,
        round: roundNumber,
        home_team_id: teamIds[actualHomeIndex],
        away_team_id: teamIds[actualAwayIndex],
        home_team_name: teamNames[actualHomeIndex],
        away_team_name: teamNames[actualAwayIndex],
        match_date: matchDate.toISOString(),
        status: 'scheduled',
        home_score: null,
        away_score: null,
        highlights: [],
        stats: {}
      });
    }

    // Rotacionar times (exceto o primeiro)
    if (round < totalRounds - 1) {
      const temp = teamIds[1];
      for (let i = 1; i < n - 1; i++) {
        teamIds[i] = teamIds[i + 1];
        teamNames[i] = teamNames[i + 1];
      }
      teamIds[n - 1] = temp;
      teamNames[n - 1] = teams.find(t => t.game_teams.id === temp)?.game_teams.name || 'Unknown';
    }
  }

  return matches;
}

createMatchesAutomatically(); 