const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🔧 CORRIGINDO CLASSIFICAÇÕES E PARTIDAS');
console.log('=' .repeat(45));

async function fixStandingsAndMatches() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Verificando competições ativas...');
    
    const { data: competitions, error } = await supabase
      .from('game_competitions')
      .select('id, name, tier, status, current_teams')
      .eq('status', 'active')
      .order('tier', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar competições:', error);
      return;
    }

    console.log('📊 Competições ativas encontradas:');
    competitions.forEach(comp => {
      console.log(`   - ${comp.name} (Tier ${comp.tier}): ${comp.current_teams} times`);
    });

    for (const competition of competitions) {
      console.log(`\n🏆 Processando ${competition.name}:`);
      
      // 1. Limpar partidas existentes
      console.log(`   🗑️  Limpando partidas existentes...`);
      const { error: deleteMatchesError } = await supabase
        .from('game_matches')
        .delete()
        .eq('competition_id', competition.id);

      if (deleteMatchesError) {
        console.error(`   ❌ Erro ao deletar partidas:`, deleteMatchesError);
        continue;
      }

      // 2. Limpar rodadas existentes
      console.log(`   🗑️  Limpando rodadas existentes...`);
      const { error: deleteRoundsError } = await supabase
        .from('game_rounds')
        .delete()
        .eq('competition_id', competition.id);

      if (deleteRoundsError) {
        console.error(`   ❌ Erro ao deletar rodadas:`, deleteRoundsError);
        continue;
      }

      // 3. Buscar times inscritos
      console.log(`   📊 Buscando times inscritos...`);
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select(`
          *,
          game_teams!inner(id, name, team_type)
        `)
        .eq('competition_id', competition.id);

      if (teamsError) {
        console.error(`   ❌ Erro ao buscar times:`, teamsError);
        continue;
      }

      console.log(`   ✅ ${enrolledTeams.length} times encontrados`);

      if (enrolledTeams.length < 2) {
        console.log(`   ⚠️  Não há times suficientes para criar partidas`);
        continue;
      }

      // 4. Criar rodadas
      console.log(`   📅 Criando rodadas...`);
      const rounds = [];
      const totalRounds = (enrolledTeams.length - 1) * 2; // Turno e returno
      
      for (let round = 1; round <= totalRounds; round++) {
        rounds.push({
          competition_id: competition.id,
          round_number: round,
          name: `Rodada ${round}`
        });
      }

      const { data: createdRounds, error: roundsError } = await supabase
        .from('game_rounds')
        .insert(rounds)
        .select();

      if (roundsError) {
        console.error(`   ❌ Erro ao criar rodadas:`, roundsError);
        continue;
      }

      console.log(`   ✅ ${createdRounds.length} rodadas criadas`);

      // 5. Gerar partidas com novo algoritmo
      console.log(`   ⚽ Gerando partidas com alternância casa/fora...`);
      const matches = generateImprovedRoundRobinMatches(enrolledTeams, competition.id, createdRounds);
      
      // 6. Inserir partidas em lotes
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

      console.log(`   ✅ ${matches.length} partidas criadas`);

      // 7. Limpar classificações antigas
      console.log(`   🗑️  Limpando classificações antigas...`);
      const { error: deleteStandingsError } = await supabase
        .from('game_standings')
        .delete()
        .eq('competition_id', competition.id);

      if (deleteStandingsError) {
        console.error(`   ❌ Erro ao deletar classificações:`, deleteStandingsError);
      }

      // 8. Criar classificações iniciais
      console.log(`   📊 Criando classificações iniciais...`);
      for (const team of enrolledTeams) {
        const { error: standingsError } = await supabase
          .from('game_standings')
          .insert({
            competition_id: competition.id,
            team_id: team.game_teams.id,
            season_year: new Date().getFullYear(),
            position: 0,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          });

        if (standingsError) {
          console.error(`   ❌ Erro ao criar classificação para ${team.game_teams.name}:`, standingsError);
        }
      }

      console.log(`   ✅ Classificações iniciais criadas`);
    }

    console.log('\n🎯 CORREÇÕES APLICADAS:');
    console.log('✅ Partidas recriadas com alternância casa/fora');
    console.log('✅ Classificações corrigidas');
    console.log('✅ Rodadas reorganizadas');
    console.log('✅ Sistema pronto para simulação');

  } catch (error) {
    console.error('❌ Erro durante as correções:', error);
  }
}

function generateImprovedRoundRobinMatches(teams, competitionId, rounds) {
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

fixStandingsAndMatches(); 