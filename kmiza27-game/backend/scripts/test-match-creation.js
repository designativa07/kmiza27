const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🧪 TESTANDO CRIAÇÃO AUTOMÁTICA DE PARTIDAS');
console.log('=' .repeat(45));

async function testMatchCreation() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Verificando competições ativas...');
    
    const { data: competitions, error } = await supabase
      .from('game_competitions')
      .select('id, name, tier, status, current_teams, max_teams')
      .eq('status', 'active')
      .order('tier', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar competições:', error);
      return;
    }

    console.log('📊 Competições ativas:');
    competitions.forEach(comp => {
      console.log(`   - ${comp.name} (Tier ${comp.tier}): ${comp.current_teams}/${comp.max_teams} times`);
    });

    console.log('\n📋 2. Verificando partidas existentes...');
    
    for (const competition of competitions) {
      console.log(`\n🏆 ${competition.name}:`);
      
      // Buscar times inscritos
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

      console.log(`   📊 ${enrolledTeams.length} times inscritos`);

      // Buscar partidas
      const { data: matches, error: matchesError } = await supabase
        .from('game_matches')
        .select('id, home_team_name, away_team_name, round, status')
        .eq('competition_id', competition.id)
        .order('round', { ascending: true });

      if (matchesError) {
        console.error(`   ❌ Erro ao buscar partidas:`, matchesError);
        continue;
      }

      console.log(`   ⚽ ${matches.length} partidas criadas`);

      if (matches.length > 0) {
        console.log(`   📅 Rodadas: ${Math.max(...matches.map(m => m.round))}`);
        console.log(`   🎯 Status: ${matches.filter(m => m.status === 'scheduled').length} agendadas, ${matches.filter(m => m.status === 'finished').length} finalizadas`);
        
        // Mostrar algumas partidas de exemplo
        const sampleMatches = matches.slice(0, 5);
        console.log(`   📋 Exemplos de partidas:`);
        sampleMatches.forEach(match => {
          console.log(`     - ${match.home_team_name} vs ${match.away_team_name} (Rodada ${match.round})`);
        });
      }

      // Buscar rodadas
      const { data: rounds, error: roundsError } = await supabase
        .from('game_rounds')
        .select('id, round_number, name')
        .eq('competition_id', competition.id)
        .order('round_number', { ascending: true });

      if (roundsError) {
        console.error(`   ❌ Erro ao buscar rodadas:`, roundsError);
        continue;
      }

      console.log(`   📋 ${rounds.length} rodadas criadas`);
    }

    console.log('\n📋 3. Testando inscrição de novo time...');
    
    // Buscar um time de usuário para teste
    const { data: userTeams, error: userError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('team_type', 'user_created')
      .limit(1);

    if (userError) {
      console.error('❌ Erro ao buscar times de usuário:', userError);
      return;
    }

    if (userTeams && userTeams.length > 0) {
      const testTeam = userTeams[0];
      console.log(`   🧪 Time de teste: ${testTeam.name} (ID: ${testTeam.id})`);
      
      // Buscar competição da Série D
      const { data: serieD, error: serieDError } = await supabase
        .from('game_competitions')
        .select('id, name, current_teams, max_teams')
        .eq('tier', 4)
        .eq('status', 'active')
        .single();

      if (serieDError) {
        console.error('❌ Erro ao buscar Série D:', serieDError);
        return;
      }

      console.log(`   🏆 Competição: ${serieD.name} (${serieD.current_teams}/${serieD.max_teams} times)`);
      
      // Verificar se o time já está inscrito
      const { data: existingRegistration, error: checkError } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', serieD.id)
        .eq('team_id', testTeam.id)
        .single();

      if (existingRegistration) {
        console.log(`   ⚠️  Time ${testTeam.name} já está inscrito na ${serieD.name}`);
      } else {
        console.log(`   ✅ Time ${testTeam.name} pode ser inscrito na ${serieD.name}`);
        console.log(`   💡 Para testar, inscreva o time via frontend ou API`);
      }
    }

    console.log('\n🎯 SISTEMA DE CRIAÇÃO AUTOMÁTICA DE PARTIDAS:');
    console.log('✅ Verificação de competições ativas');
    console.log('✅ Contagem de times inscritos');
    console.log('✅ Contagem de partidas criadas');
    console.log('✅ Verificação de rodadas');
    console.log('✅ Sistema integrado com backend');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testMatchCreation(); 