const { getSupabaseServiceClient } = require('../config/supabase-connection');
const supabase = getSupabaseServiceClient('vps');

async function testAutoEnrollmentDirect() {
  console.log('🔍 Testando autoEnrollInCompetition diretamente...\n');

  try {
    // 1. Buscar o time mais recente
    console.log('1. Buscando time mais recente...');
    const { data: recentTeams, error: teamError } = await supabase
      .from('game_teams')
      .select('id, name, created_at')
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

    // Escolher a primeira competição disponível
    const availableCompetition = competitions[0];
    console.log(`   - Competição escolhida: ${availableCompetition.name} (Tier ${availableCompetition.tier})`);

    // Verificar se o time já está inscrito
    console.log('   - Verificando se o time já está inscrito...');
    const { data: existingEnrollment, error: enrollmentError } = await supabase
      .from('game_competition_teams')
      .select('*')
      .eq('team_id', testTeam.id)
      .eq('competition_id', availableCompetition.id);

    if (enrollmentError) {
      console.error('❌ Erro ao verificar inscrição:', enrollmentError);
      return;
    }

    if (existingEnrollment && existingEnrollment.length > 0) {
      console.log('✅ Time já está inscrito nesta competição');
      return;
    }

    console.log('   - Time não está inscrito, prosseguindo...');

    // Inserir inscrição
    console.log('   - Inserindo inscrição...');
    const { error: insertError } = await supabase
      .from('game_competition_teams')
      .insert({
        competition_id: availableCompetition.id,
        team_id: testTeam.id
      });

    if (insertError) {
      console.error('❌ Erro ao inserir inscrição:', insertError);
      return;
    }

    console.log('✅ Inscrição inserida com sucesso');

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
        team_id: testTeam.id,
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
      console.error('❌ Erro ao criar entrada na classificação:', standingsError);
    } else {
      console.log('✅ Entrada na classificação criada');
    }

    // Verificar se deve criar partidas
    console.log('\n3. Verificando se deve criar partidas...');
    const { data: enrolledTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_teams!inner(id, name, team_type)
      `)
      .eq('competition_id', availableCompetition.id);

    if (teamsError) {
      console.error('❌ Erro ao buscar times inscritos:', teamsError);
      return;
    }

    console.log(`   - Times inscritos: ${enrolledTeams.length}`);

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

    if (existingMatches.length === 0 && enrolledTeams.length >= 2) {
      console.log('✅ Deve criar partidas automaticamente');
      console.log('🔧 O método checkAndCreateMatches deveria criar partidas');
    } else if (existingMatches.length > 0) {
      console.log('⚠️ Partidas já existem');
    } else {
      console.log('⚠️ Não há times suficientes para criar partidas');
    }

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAutoEnrollmentDirect(); 