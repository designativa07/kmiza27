const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function verificarECriarPartidas() {
  console.log('🔍 Verificando status das competições e partidas...\n');

  try {
    // Buscar todas as competições ativas
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true });

    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }

    console.log(`✅ Encontradas ${competitions.length} competições ativas\n`);

    for (const competition of competitions) {
      console.log(`🏆 Processando ${competition.name} (Tier ${competition.tier})`);
      
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

      console.log(`   - Times inscritos: ${enrolledTeams.length}`);

      // Buscar partidas existentes
      const { data: existingMatches, error: matchesError } = await supabase
        .from('game_matches')
        .select('id, round_number')
        .eq('competition_id', competition.id);

      if (matchesError) {
        console.error(`❌ Erro ao buscar partidas da ${competition.name}:`, matchesError);
        continue;
      }

      console.log(`   - Partidas existentes: ${existingMatches.length}`);

      // Se não há partidas e há times suficientes, criar calendário
      if (existingMatches.length === 0 && enrolledTeams.length >= 2) {
        console.log(`   🎯 Criando calendário de partidas para ${competition.name}...`);
        
        try {
          // Criar rodadas (turno e returno)
          const rounds = [];
          const totalRounds = (enrolledTeams.length - 1) * 2; // Turno e returno
          
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
            console.error(`❌ Erro ao criar rodadas:`, roundsError);
            continue;
          }

          console.log(`   ✅ Criadas ${createdRounds.length} rodadas`);

          // Gerar partidas usando algoritmo de round-robin
          const matches = generateRoundRobinMatches(enrolledTeams, competition.id, createdRounds);
          
          console.log(`   📅 Geradas ${matches.length} partidas`);

          // Inserir partidas em lotes
          const batchSize = 10;
          let insertedCount = 0;
          
          for (let i = 0; i < matches.length; i += batchSize) {
            const batch = matches.slice(i, i + batchSize);
            
            const { error: insertError } = await supabase
              .from('game_matches')
              .insert(batch);

            if (insertError) {
              console.error(`❌ Erro ao inserir lote de partidas:`, insertError);
              continue;
            }
            
            insertedCount += batch.length;
          }

          console.log(`   ✅ Inseridas ${insertedCount} partidas com sucesso!`);
          
        } catch (error) {
          console.error(`❌ Erro ao criar calendário para ${competition.name}:`, error);
        }
      } else if (existingMatches.length > 0) {
        console.log(`   ✅ Partidas já existem para ${competition.name}`);
      } else {
        console.log(`   ⚠️ Não há times suficientes para criar partidas (${enrolledTeams.length} times)`);
      }

      console.log('');
    }

    console.log('🎉 Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

function generateRoundRobinMatches(teams, competitionId, rounds) {
  const matches = [];
  const teamIds = teams.map(t => t.team_id);
  const n = teamIds.length;
  
  // Se número ímpar, adicionar "bye" (descanso)
  if (n % 2 === 1) {
    teamIds.push(null);
  }

  const numRounds = n - 1;
  const halfSize = n / 2;

  for (let round = 0; round < numRounds; round++) {
    const roundMatches = [];
    
    for (let i = 0; i < halfSize; i++) {
      const team1 = teamIds[i];
      const team2 = teamIds[n - 1 - i];
      
      if (team1 !== null && team2 !== null) {
        // Primeira metade: turno
        if (round < numRounds / 2) {
          roundMatches.push({
            competition_id: competitionId,
            round_id: rounds[round].id,
            round_number: rounds[round].round_number,
            home_team_id: team1,
            away_team_id: team2,
            match_date: new Date(Date.now() + (round * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            status: 'scheduled',
            home_goals: null,
            away_goals: null,
            highlights: null
          });
        } else {
          // Segunda metade: returno
          roundMatches.push({
            competition_id: competitionId,
            round_id: rounds[round].id,
            round_number: rounds[round].round_number,
            home_team_id: team2,
            away_team_id: team1,
            match_date: new Date(Date.now() + (round * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            status: 'scheduled',
            home_goals: null,
            away_goals: null,
            highlights: null
          });
        }
      }
    }
    
    matches.push(...roundMatches);
    
    // Rotacionar times (exceto o primeiro)
    const temp = teamIds[1];
    for (let i = 1; i < n - 1; i++) {
      teamIds[i] = teamIds[i + 1];
    }
    teamIds[n - 1] = temp;
  }
  
  return matches;
}

verificarECriarPartidas(); 