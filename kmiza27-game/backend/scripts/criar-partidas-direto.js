const { createClient } = require('@supabase/supabase-js');

// Definir variáveis de ambiente diretamente
const SUPABASE_URL = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

console.log('🔧 Conectando ao Supabase...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function criarPartidasDireto() {
  console.log('🎯 Criando partidas diretamente no banco de dados...\n');

  const competitionId = '045a3b64-59fc-48fd-ad8f-828b4f1a5319'; // Série D

  try {
    // Buscar times inscritos
    const { data: enrolledTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select(`
        team_id,
        game_teams!inner(
          id,
          name,
          team_type
        )
      `)
      .eq('competition_id', competitionId);

    if (teamsError) {
      console.error('❌ Erro ao buscar times inscritos:', teamsError);
      return;
    }

    console.log(`📋 Encontrados ${enrolledTeams.length} times inscritos`);

    if (enrolledTeams.length < 2) {
      console.log('❌ Não há times suficientes para criar partidas');
      return;
    }

    // Criar rodadas primeiro
    console.log('\n🎯 Criando rodadas...');
    
    const rounds = [];
    const totalRounds = 38; // 19 times = 18 rodadas no turno + 18 no returno = 36 rodadas
    
    for (let round = 1; round <= totalRounds; round++) {
      rounds.push({
        competition_id: competitionId,
        round_number: round,
        name: `Rodada ${round}`
      });
    }

    const { data: createdRounds, error: roundsError } = await supabase
      .from('game_rounds')
      .insert(rounds)
      .select();

    if (roundsError) {
      console.error('❌ Erro ao criar rodadas:', roundsError);
      return;
    }

    console.log(`✅ Criadas ${createdRounds.length} rodadas`);

    // Gerar partidas usando algoritmo de round-robin
    console.log('\n🎯 Gerando partidas...');
    
    const matches = generateRoundRobinMatches(enrolledTeams, competitionId, createdRounds);
    console.log(`📅 Geradas ${matches.length} partidas`);

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

    console.log(`✅ Inseridas ${insertedCount} partidas com sucesso!`);
    console.log('\n🎉 Partidas criadas com sucesso!');
    console.log('📋 Resumo:');
    console.log(`   - Rodadas criadas: ${createdRounds.length}`);
    console.log(`   - Partidas criadas: ${insertedCount}`);
    console.log('   - As partidas devem aparecer no frontend agora');

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

criarPartidasDireto(); 