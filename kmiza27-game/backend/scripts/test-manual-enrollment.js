const { getSupabaseServiceClient } = require('../config/supabase-connection');

const supabase = getSupabaseServiceClient('vps');

async function testManualEnrollment() {
  console.log('🧪 Testando inscrição manual...\n');

  try {
    // 1. Buscar times criados pelo usuário
    console.log('1. Buscando times criados pelo usuário...');
    const { data: userTeams, error: userTeamsError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('team_type', 'user_created')
      .order('created_at', { ascending: false })
      .limit(1);

    if (userTeamsError) {
      console.error('❌ Erro ao buscar times:', userTeamsError);
      return;
    }

    if (!userTeams || userTeams.length === 0) {
      console.log('❌ Nenhum time criado pelo usuário encontrado');
      return;
    }

    const team = userTeams[0];
    console.log(`✅ Time encontrado: ${team.name} (ID: ${team.id})`);

    // 2. Buscar competições disponíveis
    console.log('\n2. Buscando competições disponíveis...');
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('status', 'active')
      .order('tier', { ascending: true });

    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }

    if (!competitions || competitions.length === 0) {
      console.log('❌ Nenhuma competição disponível encontrada');
      return;
    }

    const competition = competitions[0];
    console.log(`✅ Competição encontrada: ${competition.name} (ID: ${competition.id})`);
    console.log(`   - Times atuais: ${competition.current_teams}/${competition.max_teams}`);

    // 3. Verificar se o time já está inscrito
    console.log('\n3. Verificando se o time já está inscrito...');
    const { data: existingEnrollment, error: enrollmentError } = await supabase
      .from('game_competition_teams')
      .select('*')
      .eq('team_id', team.id)
      .eq('competition_id', competition.id);

    if (enrollmentError) {
      console.error('❌ Erro ao verificar inscrição:', enrollmentError);
      return;
    }

    if (existingEnrollment && existingEnrollment.length > 0) {
      console.log('✅ Time já está inscrito nesta competição');
    } else {
      console.log('⚠️  Time não está inscrito, tentando inscrever...');

      // 4. Inscrição manual
      console.log('\n4. Inscrição manual...');
      const { error: insertError } = await supabase
        .from('game_competition_teams')
        .insert({
          competition_id: competition.id,
          team_id: team.id
        });

      if (insertError) {
        console.error('❌ Erro ao inscrever time:', insertError);
        return;
      }

      console.log('✅ Time inscrito com sucesso!');

      // 5. Atualizar contador da competição
      console.log('\n5. Atualizando contador da competição...');
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: competition.current_teams + 1 })
        .eq('id', competition.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar contador:', updateError);
      } else {
        console.log('✅ Contador atualizado');
      }

      // 6. Criar entrada na classificação
      console.log('\n6. Criando entrada na classificação...');
      const { error: standingsError } = await supabase
        .from('game_standings')
        .insert({
          competition_id: competition.id,
          team_id: team.id,
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
        console.error('❌ Erro ao criar classificação:', standingsError);
      } else {
        console.log('✅ Entrada de classificação criada');
      }
    }

    // 7. Verificar todos os times inscritos na competição
    console.log('\n7. Verificando todos os times inscritos...');
    const { data: allEnrollments, error: allEnrollmentsError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_teams!inner(id, name, team_type)
      `)
      .eq('competition_id', competition.id);

    if (allEnrollmentsError) {
      console.error('❌ Erro ao buscar inscrições:', allEnrollmentsError);
      return;
    }

    console.log(`✅ Total de times inscritos: ${allEnrollments.length}`);
    allEnrollments.forEach(enrollment => {
      console.log(`   - ${enrollment.game_teams.name} (${enrollment.game_teams.team_type})`);
    });

    // 8. Verificar se há partidas
    console.log('\n8. Verificando partidas...');
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('*')
      .eq('competition_id', competition.id);

    if (matchesError) {
      console.error('❌ Erro ao buscar partidas:', matchesError);
      return;
    }

    console.log(`✅ Partidas encontradas: ${matches.length}`);
    if (matches.length === 0 && allEnrollments.length >= 2) {
      console.log('⚠️  Nenhuma partida foi criada, mas há times suficientes');
      console.log('🔧 Isso indica um problema no método checkAndCreateMatches');
    } else if (matches.length > 0) {
      console.log('✅ Partidas já existem');
    } else {
      console.log('⚠️  Não há times suficientes para criar partidas (mínimo: 2)');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testManualEnrollment(); 