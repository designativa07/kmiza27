const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://vps.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NDkzMDc2OTcsImV4cCI6MjA2NDg4MzY5N30.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAutoEnrollment() {
  console.log('🔍 Debugando inscrição automática...\n');

  try {
    // 1. Verificar times criados pelo usuário
    console.log('1. Verificando times criados pelo usuário...');
    const { data: userTeams, error: userTeamsError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('team_type', 'user_created');

    if (userTeamsError) {
      console.error('❌ Erro ao buscar times do usuário:', userTeamsError);
      return;
    }

    console.log(`✅ Encontrados ${userTeams.length} times criados pelo usuário:`);
    userTeams.forEach(team => {
      console.log(`   - ${team.name} (ID: ${team.id})`);
    });

    // 2. Verificar inscrições em competições
    console.log('\n2. Verificando inscrições em competições...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('game_competition_teams')
      .select('*');

    if (enrollmentsError) {
      console.error('❌ Erro ao buscar inscrições:', enrollmentsError);
      return;
    }

    console.log(`✅ Encontradas ${enrollments.length} inscrições:`);
    enrollments.forEach(enrollment => {
      console.log(`   - Time ID: ${enrollment.team_id}, Competição ID: ${enrollment.competition_id}`);
    });

    // 3. Verificar competições
    console.log('\n3. Verificando competições...');
    const { data: competitions, error: competitionsError } = await supabase
      .from('game_competitions')
      .select('*');

    if (competitionsError) {
      console.error('❌ Erro ao buscar competições:', competitionsError);
      return;
    }

    console.log(`✅ Encontradas ${competitions.length} competições:`);
    competitions.forEach(comp => {
      console.log(`   - ${comp.name} (ID: ${comp.id}, Tier: ${comp.tier}, Times atuais: ${comp.current_teams}/${comp.max_teams})`);
    });

    // 4. Verificar partidas
    console.log('\n4. Verificando partidas...');
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('*');

    if (matchesError) {
      console.error('❌ Erro ao buscar partidas:', matchesError);
      return;
    }

    console.log(`✅ Encontradas ${matches.length} partidas:`);
    if (matches.length > 0) {
      matches.slice(0, 5).forEach(match => {
        console.log(`   - ${match.home_team_id} vs ${match.away_team_id} (Rodada: ${match.round})`);
      });
      if (matches.length > 5) {
        console.log(`   ... e mais ${matches.length - 5} partidas`);
      }
    }

    // 5. Verificar rodadas
    console.log('\n5. Verificando rodadas...');
    const { data: rounds, error: roundsError } = await supabase
      .from('game_rounds')
      .select('*');

    if (roundsError) {
      console.error('❌ Erro ao buscar rodadas:', roundsError);
      return;
    }

    console.log(`✅ Encontradas ${rounds.length} rodadas:`);
    if (rounds.length > 0) {
      rounds.slice(0, 5).forEach(round => {
        console.log(`   - Rodada ${round.round_number} (Competição: ${round.competition_id})`);
      });
      if (rounds.length > 5) {
        console.log(`   ... e mais ${rounds.length - 5} rodadas`);
      }
    }

    // 6. Verificar classificações
    console.log('\n6. Verificando classificações...');
    const { data: standings, error: standingsError } = await supabase
      .from('game_standings')
      .select('*');

    if (standingsError) {
      console.error('❌ Erro ao buscar classificações:', standingsError);
      return;
    }

    console.log(`✅ Encontradas ${standings.length} entradas de classificação:`);
    if (standings.length > 0) {
      standings.slice(0, 5).forEach(standing => {
        console.log(`   - Time ID: ${standing.team_id}, Competição: ${standing.competition_id}, Pontos: ${standing.points}`);
      });
      if (standings.length > 5) {
        console.log(`   ... e mais ${standings.length - 5} entradas`);
      }
    }

    // 7. Análise específica da Série D
    console.log('\n7. Análise específica da Série D...');
    const serieDId = '045a3b64-59fc-48fd-ad8f-828b4f1a5319';
    
    const { data: serieDEnrollments, error: serieDEnrollmentsError } = await supabase
      .from('game_competition_teams')
      .select('*')
      .eq('competition_id', serieDId);

    if (serieDEnrollmentsError) {
      console.error('❌ Erro ao buscar inscrições da Série D:', serieDEnrollmentsError);
      return;
    }

    console.log(`✅ Série D tem ${serieDEnrollments.length} times inscritos`);
    
    // Verificar se há pelo menos 2 times para criar partidas
    if (serieDEnrollments.length >= 2) {
      console.log('✅ Há times suficientes para criar partidas');
      
      // Verificar se as partidas já existem
      const { data: serieDMatches, error: serieDMatchesError } = await supabase
        .from('game_matches')
        .select('*')
        .eq('competition_id', serieDId);

      if (serieDMatchesError) {
        console.error('❌ Erro ao buscar partidas da Série D:', serieDMatchesError);
        return;
      }

      console.log(`✅ Série D tem ${serieDMatches.length} partidas criadas`);
      
      if (serieDMatches.length === 0) {
        console.log('⚠️  Nenhuma partida foi criada automaticamente!');
        console.log('🔧 Isso pode indicar um problema no método checkAndCreateMatches');
      }
    } else {
      console.log('⚠️  Não há times suficientes para criar partidas (mínimo: 2)');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugAutoEnrollment(); 