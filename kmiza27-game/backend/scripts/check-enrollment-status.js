const { getSupabaseServiceClient } = require('../config/supabase-connection');

const supabase = getSupabaseServiceClient('vps');

async function checkEnrollmentStatus() {
  console.log('🔍 Verificando status da inscrição...\n');

  try {
    // 1. Verificar times criados pelo usuário
    console.log('1. Verificando times criados pelo usuário...');
    const { data: userTeams, error: userTeamsError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('team_type', 'user_created')
      .order('created_at', { ascending: false })
      .limit(5);

    if (userTeamsError) {
      console.error('❌ Erro ao buscar times do usuário:', userTeamsError);
      return;
    }

    console.log(`✅ Encontrados ${userTeams.length} times criados pelo usuário:`);
    userTeams.forEach(team => {
      console.log(`   - ${team.name} (ID: ${team.id}, Criado: ${team.created_at})`);
    });

    if (userTeams.length === 0) {
      console.log('❌ Nenhum time criado pelo usuário encontrado');
      return;
    }

    const latestTeam = userTeams[0];
    console.log(`\n🔍 Analisando time mais recente: ${latestTeam.name}`);

    // 2. Verificar se o time está inscrito em alguma competição
    console.log('\n2. Verificando inscrições em competições...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('game_competition_teams')
      .select('*')
      .eq('team_id', latestTeam.id);

    if (enrollmentsError) {
      console.error('❌ Erro ao buscar inscrições:', enrollmentsError);
      return;
    }

    console.log(`✅ Encontradas ${enrollments.length} inscrições para o time:`);
    enrollments.forEach(enrollment => {
      console.log(`   - Competição ID: ${enrollment.competition_id}`);
    });

    if (enrollments.length === 0) {
      console.log('❌ Time não está inscrito em nenhuma competição');
      console.log('🔧 Isso indica que o método autoEnrollInCompetition não funcionou');
      return;
    }

    const competitionId = enrollments[0].competition_id;
    console.log(`\n🔍 Analisando competição: ${competitionId}`);

    // 3. Verificar detalhes da competição
    console.log('\n3. Verificando detalhes da competição...');
    const { data: competition, error: competitionError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('id', competitionId)
      .single();

    if (competitionError) {
      console.error('❌ Erro ao buscar competição:', competitionError);
      return;
    }

    console.log(`✅ Competição: ${competition.name} (Tier: ${competition.tier})`);
    console.log(`   - Times atuais: ${competition.current_teams}/${competition.max_teams}`);

    // 4. Verificar todos os times inscritos na competição
    console.log('\n4. Verificando todos os times inscritos na competição...');
    const { data: allEnrollments, error: allEnrollmentsError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_teams!inner(id, name, team_type)
      `)
      .eq('competition_id', competitionId);

    if (allEnrollmentsError) {
      console.error('❌ Erro ao buscar todos os times inscritos:', allEnrollmentsError);
      return;
    }

    console.log(`✅ Total de times inscritos: ${allEnrollments.length}`);
    allEnrollments.forEach(enrollment => {
      console.log(`   - ${enrollment.game_teams.name} (${enrollment.game_teams.team_type})`);
    });

    // 5. Verificar se há partidas criadas
    console.log('\n5. Verificando partidas...');
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('*')
      .eq('competition_id', competitionId);

    if (matchesError) {
      console.error('❌ Erro ao buscar partidas:', matchesError);
      return;
    }

    console.log(`✅ Partidas encontradas: ${matches.length}`);
    if (matches.length === 0) {
      console.log('⚠️  Nenhuma partida foi criada');
      console.log('🔧 Isso pode indicar um problema no método checkAndCreateMatches');
      
      // Verificar se há pelo menos 2 times para criar partidas
      if (allEnrollments.length >= 2) {
        console.log('✅ Há times suficientes para criar partidas (mínimo: 2)');
        console.log('🔧 O problema pode estar na lógica de criação de partidas');
      } else {
        console.log('⚠️  Não há times suficientes para criar partidas (mínimo: 2)');
      }
    } else {
      console.log('✅ Partidas criadas automaticamente!');
      matches.slice(0, 5).forEach(match => {
        console.log(`   - ${match.home_team_name} vs ${match.away_team_name} (Rodada ${match.round})`);
      });
    }

    // 6. Verificar rodadas
    console.log('\n6. Verificando rodadas...');
    const { data: rounds, error: roundsError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('competition_id', competitionId);

    if (roundsError) {
      console.error('❌ Erro ao buscar rodadas:', roundsError);
      return;
    }

    console.log(`✅ Rodadas encontradas: ${rounds.length}`);
    if (rounds.length > 0) {
      rounds.slice(0, 5).forEach(round => {
        console.log(`   - Rodada ${round.round_number}: ${round.name}`);
      });
    }

    // 7. Verificar classificações
    console.log('\n7. Verificando classificações...');
    const { data: standings, error: standingsError } = await supabase
      .from('game_standings')
      .select('*')
      .eq('competition_id', competitionId);

    if (standingsError) {
      console.error('❌ Erro ao buscar classificações:', standingsError);
      return;
    }

    console.log(`✅ Entradas de classificação: ${standings.length}`);
    if (standings.length > 0) {
      standings.slice(0, 5).forEach(standing => {
        console.log(`   - Time ID: ${standing.team_id}, Pontos: ${standing.points}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkEnrollmentStatus(); 