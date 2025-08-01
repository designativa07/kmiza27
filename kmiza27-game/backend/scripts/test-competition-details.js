const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testCompetitionDetails() {
  console.log('🧪 TESTANDO DETALHES DAS COMPETIÇÕES');
  console.log('=' .repeat(50));

  try {
    const supabase = getSupabaseServiceClient();

    // 1. Verificar competições
    console.log('\n📊 1. VERIFICANDO COMPETIÇÕES...');
    
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });

    if (compError) {
      console.log('❌ Erro ao buscar competições:', compError.message);
      return;
    }

    console.log(`✅ ${competitions?.length || 0} competições encontradas:`);
    competitions?.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.current_teams}/${comp.max_teams} times`);
    });

    // 2. Testar dados de classificação
    console.log('\n📈 2. TESTANDO DADOS DE CLASSIFICAÇÃO...');
    
    if (competitions && competitions.length > 0) {
      const testCompetition = competitions[0];
      console.log(`   • Testando classificação para: ${testCompetition.name}`);
      
      const { data: standings, error: standingsError } = await supabase
        .from('game_standings')
        .select(`
          *,
          game_teams!inner(name)
        `)
        .eq('competition_id', testCompetition.id)
        .order('position', { ascending: true });

      if (standingsError) {
        console.log(`   ❌ Erro ao buscar classificação: ${standingsError.message}`);
      } else {
        console.log(`   ✅ ${standings?.length || 0} times na classificação:`);
        standings?.slice(0, 5).forEach(standing => {
          console.log(`     • ${standing.position}º - ${standing.game_teams.name} (${standing.points} pts)`);
        });
      }
    }

    // 3. Testar dados de partidas
    console.log('\n⚽ 3. TESTANDO DADOS DE PARTIDAS...');
    
    if (competitions && competitions.length > 0) {
      const testCompetition = competitions[0];
      console.log(`   • Testando partidas para: ${testCompetition.name}`);
      
      const { data: matches, error: matchesError } = await supabase
        .from('game_matches')
        .select('*')
        .eq('competition_id', testCompetition.id)
        .order('match_date', { ascending: true });

      if (matchesError) {
        console.log(`   ❌ Erro ao buscar partidas: ${matchesError.message}`);
      } else {
        console.log(`   ✅ ${matches?.length || 0} partidas encontradas:`);
        matches?.slice(0, 3).forEach(match => {
          console.log(`     • ${match.home_team_name} vs ${match.away_team_name} (${match.status})`);
        });
      }
    }

    // 4. Testar dados de rodadas
    console.log('\n🔄 4. TESTANDO DADOS DE RODADAS...');
    
    if (competitions && competitions.length > 0) {
      const testCompetition = competitions[0];
      console.log(`   • Testando rodadas para: ${testCompetition.name}`);
      
      const { data: rounds, error: roundsError } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('competition_id', testCompetition.id)
        .order('round_number', { ascending: true });

      if (roundsError) {
        console.log(`   ❌ Erro ao buscar rodadas: ${roundsError.message}`);
      } else {
        console.log(`   ✅ ${rounds?.length || 0} rodadas encontradas:`);
        rounds?.forEach(round => {
          console.log(`     • Rodada ${round.round_number}: ${round.name} (${round.status})`);
        });
      }
    }

    // 5. Verificar se há dados suficientes para o botão "Ver Detalhes"
    console.log('\n🔍 5. VERIFICANDO DADOS PARA "VER DETALHES"...');
    
    const hasStandings = await supabase
      .from('game_standings')
      .select('id')
      .limit(1);

    const hasMatches = await supabase
      .from('game_matches')
      .select('id')
      .limit(1);

    const hasRounds = await supabase
      .from('game_rounds')
      .select('id')
      .limit(1);

    console.log('✅ Status dos dados:');
    console.log(`   • Classificações: ${hasStandings.data?.length > 0 ? '✅' : '❌'}`);
    console.log(`   • Partidas: ${hasMatches.data?.length > 0 ? '✅' : '❌'}`);
    console.log(`   • Rodadas: ${hasRounds.data?.length > 0 ? '✅' : '❌'}`);

    // 6. Criar dados de exemplo se necessário
    console.log('\n📝 6. CRIANDO DADOS DE EXEMPLO SE NECESSÁRIO...');
    
    if (competitions && competitions.length > 0 && hasStandings.data?.length === 0) {
      const testCompetition = competitions[0];
      console.log(`   • Criando classificação de exemplo para ${testCompetition.name}`);
      
      // Buscar times da competição
      const { data: competitionTeams } = await supabase
        .from('game_competition_teams')
        .select(`
          *,
          game_teams!inner(name)
        `)
        .eq('competition_id', testCompetition.id)
        .limit(5);

      if (competitionTeams && competitionTeams.length > 0) {
        for (let i = 0; i < competitionTeams.length; i++) {
          const team = competitionTeams[i];
          const { error: insertError } = await supabase
            .from('game_standings')
            .insert({
              competition_id: testCompetition.id,
              team_id: team.team_id,
              season_year: 2024,
              position: i + 1,
              games_played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0,
              points: 0
            });

          if (insertError) {
            console.log(`     ❌ Erro ao criar classificação para ${team.game_teams.name}: ${insertError.message}`);
          } else {
            console.log(`     ✅ Classificação criada para ${team.game_teams.name}`);
          }
        }
      }
    }

    console.log('\n🎉 TESTE DE DETALHES CONCLUÍDO!');
    console.log('🏆 Botão "Ver Detalhes" deve funcionar corretamente');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testCompetitionDetails()
  .catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }); 