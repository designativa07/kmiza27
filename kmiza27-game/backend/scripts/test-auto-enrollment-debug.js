const { getSupabaseServiceClient } = require('../config/supabase-connection');

const supabase = getSupabaseServiceClient('vps');

async function testAutoEnrollmentDebug() {
  console.log('🧪 Debugando autoEnrollInCompetition...\n');

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

    // 2. Simular o método autoEnrollInCompetition
    console.log('\n2. Simulando autoEnrollInCompetition...');
    
    // Buscar competições disponíveis
    console.log('   - Buscando competições disponíveis...');
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams')
      .eq('status', 'active')
      .order('tier', { ascending: true });

    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }

    console.log(`   - Competições encontradas: ${competitions.length}`);
    competitions.forEach(comp => {
      console.log(`     - ${comp.name} (Tier ${comp.tier}): ${comp.current_teams}/${comp.max_teams}`);
    });

    if (!competitions || competitions.length === 0) {
      console.log('❌ Nenhuma competição disponível encontrada');
      return;
    }

    // Priorizar Série D (tier 4), depois C, B, A
    const availableCompetition = competitions[0];
    console.log(`   - Competição selecionada: ${availableCompetition.name} (Tier ${availableCompetition.tier})`);

    // Verificar se há vagas
    if (availableCompetition.current_teams >= availableCompetition.max_teams) {
      console.log(`❌ Competição ${availableCompetition.name} está cheia`);
      return;
    }

    console.log(`   - Vagas disponíveis: ${availableCompetition.max_teams - availableCompetition.current_teams}`);

    // Verificar se o time já está inscrito
    console.log('   - Verificando se o time já está inscrito...');
    const { data: existingEnrollment, error: enrollmentError } = await supabase
      .from('game_competition_teams')
      .select('*')
      .eq('team_id', team.id)
      .eq('competition_id', availableCompetition.id);

    if (enrollmentError) {
      console.error('❌ Erro ao verificar inscrição:', enrollmentError);
      return;
    }

    if (existingEnrollment && existingEnrollment.length > 0) {
      console.log('✅ Time já está inscrito nesta competição');
    } else {
      console.log('⚠️  Time não está inscrito, tentando inscrever...');

      // Inserir inscrição
      console.log('   - Inserindo inscrição...');
      const { error: insertError } = await supabase
        .from('game_competition_teams')
        .insert({
          competition_id: availableCompetition.id,
          team_id: team.id
        });

      if (insertError) {
        console.error('❌ Erro ao inscrever time:', insertError);
        return;
      }

      console.log('✅ Time inscrito com sucesso!');

      // Atualizar contador da competição
      console.log('   - Atualizando contador da competição...');
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: availableCompetition.current_teams + 1 })
        .eq('id', availableCompetition.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar contador:', updateError);
      } else {
        console.log('✅ Contador atualizado');
      }

      // Criar entrada na classificação
      console.log('   - Criando entrada na classificação...');
      const { error: standingsError } = await supabase
        .from('game_standings')
        .insert({
          competition_id: availableCompetition.id,
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

      // Simular checkAndCreateMatches
      console.log('\n3. Simulando checkAndCreateMatches...');
      
      // Buscar todos os times inscritos na competição
      const { data: allEnrollments, error: allEnrollmentsError } = await supabase
        .from('game_competition_teams')
        .select(`
          *,
          game_teams!inner(id, name, team_type)
        `)
        .eq('competition_id', availableCompetition.id);

      if (allEnrollmentsError) {
        console.error('❌ Erro ao buscar todos os times inscritos:', allEnrollmentsError);
        return;
      }

      console.log(`   - Total de times inscritos: ${allEnrollments.length}`);

      // Verificar se já existem partidas
      const { data: existingMatches, error: matchesError } = await supabase
        .from('game_matches')
        .select('id')
        .eq('competition_id', availableCompetition.id);

      if (matchesError) {
        console.error('❌ Erro ao verificar partidas existentes:', matchesError);
        return;
      }

      console.log(`   - Partidas existentes: ${existingMatches.length}`);

      if (existingMatches.length === 0 && allEnrollments.length >= 2) {
        console.log('✅ Condições atendidas para criar partidas');
        console.log('🔧 O método checkAndCreateMatches deveria criar partidas automaticamente');
      } else if (existingMatches.length > 0) {
        console.log('✅ Partidas já existem');
      } else {
        console.log('⚠️  Não há times suficientes para criar partidas (mínimo: 2)');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAutoEnrollmentDebug(); 