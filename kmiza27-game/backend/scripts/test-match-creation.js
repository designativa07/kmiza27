const { getSupabaseServiceClient } = require('../config/supabase-connection');

const supabase = getSupabaseServiceClient('vps');

async function testMatchCreation() {
  console.log('🧪 Testando criação de partidas...\n');

  try {
    // 1. Buscar competição com times inscritos
    console.log('1. Buscando competição com times inscritos...');
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('status', 'active')
      .order('tier', { ascending: true });

    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }

    let targetCompetition = null;
    let targetEnrollments = null;

    for (const competition of competitions) {
      console.log(`\n🔍 Verificando ${competition.name}...`);
      
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('game_competition_teams')
        .select(`
          *,
          game_teams!inner(id, name, team_type)
        `)
        .eq('competition_id', competition.id);

      if (enrollmentsError) {
        console.error(`❌ Erro ao buscar inscrições de ${competition.name}:`, enrollmentsError);
        continue;
      }

      console.log(`   - Times inscritos: ${enrollments.length}`);
      
      if (enrollments.length >= 2) {
        targetCompetition = competition;
        targetEnrollments = enrollments;
        console.log(`✅ Encontrada competição com times suficientes: ${competition.name}`);
        break;
      }
    }

    if (!targetCompetition) {
      console.log('❌ Nenhuma competição com times suficientes encontrada');
      return;
    }

    console.log(`\n🎯 Trabalhando com: ${targetCompetition.name}`);
    console.log(`   - Times inscritos: ${targetEnrollments.length}`);

    // 2. Verificar se já existem partidas
    console.log('\n2. Verificando partidas existentes...');
    const { data: existingMatches, error: matchesError } = await supabase
      .from('game_matches')
      .select('*')
      .eq('competition_id', targetCompetition.id);

    if (matchesError) {
      console.error('❌ Erro ao buscar partidas:', matchesError);
      return;
    }

    console.log(`✅ Partidas existentes: ${existingMatches.length}`);

    if (existingMatches.length > 0) {
      console.log('✅ Partidas já existem, não é necessário criar novas');
      return;
    }

    // 3. Verificar rodadas existentes
    console.log('\n3. Verificando rodadas existentes...');
    let { data: existingRounds, error: roundsError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('competition_id', targetCompetition.id);

    if (roundsError) {
      console.error('❌ Erro ao buscar rodadas:', roundsError);
      return;
    }

    console.log(`✅ Rodadas existentes: ${existingRounds.length}`);

    // 4. Criar rodadas se não existirem
    if (existingRounds.length === 0) {
      console.log('\n4. Criando rodadas...');
      const rounds = [];
      const totalRounds = (targetEnrollments.length - 1) * 2; // Turno e returno
      
      for (let round = 1; round <= totalRounds; round++) {
        rounds.push({
          competition_id: targetCompetition.id,
          round_number: round,
          name: `Rodada ${round}`
        });
      }

      const { data: createdRounds, error: createRoundsError } = await supabase
        .from('game_rounds')
        .insert(rounds)
        .select();

      if (createRoundsError) {
        console.error('❌ Erro ao criar rodadas:', createRoundsError);
        return;
      }

      console.log(`✅ Criadas ${createdRounds.length} rodadas`);
      existingRounds = createdRounds;
    }

    // 5. Gerar partidas
    console.log('\n5. Gerando partidas...');
    const matches = generateRoundRobinMatches(targetEnrollments, targetCompetition.id, existingRounds);
    
    console.log(`✅ Geradas ${matches.length} partidas`);

    // 6. Inserir partidas em lotes
    console.log('\n6. Inserindo partidas...');
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('game_matches')
        .insert(batch);

      if (insertError) {
        console.error('❌ Erro ao inserir lote de partidas:', insertError);
        continue;
      }

      insertedCount += batch.length;
      console.log(`   - Inseridas ${insertedCount}/${matches.length} partidas`);
    }

    console.log(`\n✅ Processo concluído! ${insertedCount} partidas inseridas`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
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

      // Alternar casa/fora para distribuir melhor os jogos
      let finalHomeIndex = actualHomeIndex;
      let finalAwayIndex = actualAwayIndex;
      
      // Se é uma rodada par (exceto a primeira), alternar alguns jogos
      if (round > 0 && round % 2 === 1 && i % 2 === 1) {
        finalHomeIndex = actualAwayIndex;
        finalAwayIndex = actualHomeIndex;
      }

      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + round * 7); // Uma semana entre rodadas

      matches.push({
        competition_id: competitionId,
        round: roundNumber,
        home_team_id: teamIds[finalHomeIndex],
        away_team_id: teamIds[finalAwayIndex],
        home_team_name: teamNames[finalHomeIndex],
        away_team_name: teamNames[finalAwayIndex],
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

testMatchCreation(); 