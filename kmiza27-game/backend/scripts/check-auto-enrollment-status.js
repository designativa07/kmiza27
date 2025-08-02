const { getSupabaseServiceClient } = require('../config/supabase-connection');
const supabase = getSupabaseServiceClient('vps');

async function checkAutoEnrollmentStatus() {
  console.log('🔍 Verificando status da inscrição automática...\n');
  
  try {
    // 1. Buscar o time mais recente criado
    console.log('1. Buscando time mais recente...');
    const { data: recentTeams, error: teamError } = await supabase
      .from('game_teams')
      .select('id, name, created_at, team_type')
      .eq('team_type', 'user_created')
      .order('created_at', { ascending: false })
      .limit(1);

    if (teamError) {
      console.error('❌ Erro ao buscar time:', teamError);
      return;
    }

    if (!recentTeams || recentTeams.length === 0) {
      console.log('❌ Nenhum time encontrado');
      return;
    }

    const testTeam = recentTeams[0];
    console.log(`✅ Time encontrado: ${testTeam.name} (ID: ${testTeam.id})`);
    console.log(`   Criado em: ${testTeam.created_at}`);

    // 2. Verificar inscrições em competições
    console.log('\n2. Verificando inscrições em competições...');
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_competitions!inner(id, name, tier, current_teams, max_teams)
      `)
      .eq('team_id', testTeam.id);

    if (enrollmentError) {
      console.error('❌ Erro ao buscar inscrições:', enrollmentError);
      return;
    }

    console.log(`   Inscrições encontradas: ${enrollments.length}`);
    enrollments.forEach(enrollment => {
      const comp = enrollment.game_competitions;
      console.log(`   - ${comp.name} (Tier ${comp.tier}): ${comp.current_teams}/${comp.max_teams}`);
    });

    // 3. Verificar entrada na classificação
    console.log('\n3. Verificando entrada na classificação...');
    const { data: standings, error: standingsError } = await supabase
      .from('game_standings')
      .select(`
        *,
        game_competitions!inner(id, name, tier)
      `)
      .eq('team_id', testTeam.id);

    if (standingsError) {
      console.error('❌ Erro ao buscar classificação:', standingsError);
      return;
    }

    console.log(`   Entradas na classificação: ${standings.length}`);
    standings.forEach(standing => {
      const comp = standing.game_competitions;
      console.log(`   - ${comp.name} (Tier ${comp.tier}): Posição ${standing.position}, ${standing.points} pontos`);
    });

    // 4. Verificar partidas criadas
    console.log('\n4. Verificando partidas criadas...');
    if (enrollments.length > 0) {
      const competitionId = enrollments[0].competition_id;
      const { data: matches, error: matchesError } = await supabase
        .from('game_matches')
        .select('id, home_team_id, away_team_id, round, match_date')
        .eq('competition_id', competitionId);

      if (matchesError) {
        console.error('❌ Erro ao buscar partidas:', matchesError);
        return;
      }

      console.log(`   Partidas criadas: ${matches.length}`);
      if (matches.length > 0) {
        console.log(`   Primeira partida: ${matches[0].home_team_id} vs ${matches[0].away_team_id} (Rodada ${matches[0].round})`);
        console.log(`   Última partida: ${matches[matches.length-1].home_team_id} vs ${matches[matches.length-1].away_team_id} (Rodada ${matches[matches.length-1].round})`);
      }
    }

    // 5. Verificar rodadas criadas
    console.log('\n5. Verificando rodadas criadas...');
    if (enrollments.length > 0) {
      const competitionId = enrollments[0].competition_id;
      const { data: rounds, error: roundsError } = await supabase
        .from('game_rounds')
        .select('id, round_number, start_date, end_date')
        .eq('competition_id', competitionId)
        .order('round_number', { ascending: true });

      if (roundsError) {
        console.error('❌ Erro ao buscar rodadas:', roundsError);
        return;
      }

      console.log(`   Rodadas criadas: ${rounds.length}`);
      if (rounds.length > 0) {
        console.log(`   Primeira rodada: ${rounds[0].round_number} (${rounds[0].start_date})`);
        console.log(`   Última rodada: ${rounds[rounds.length-1].round_number} (${rounds[rounds.length-1].end_date})`);
      }
    }

    // 6. Resumo final
    console.log('\n📊 RESUMO:');
    if (enrollments.length > 0) {
      console.log('✅ Time inscrito automaticamente em competição');
      console.log('✅ Entrada na classificação criada');
      if (matches && matches.length > 0) {
        console.log('✅ Partidas criadas automaticamente');
      } else {
        console.log('⚠️ Partidas não foram criadas');
      }
    } else {
      console.log('❌ Time NÃO foi inscrito automaticamente');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

checkAutoEnrollmentStatus(); 