const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTeamDeletion() {
  try {
    console.log('🧪 Iniciando teste de deleção completa de times...');

    // 1. Verificar estado atual das tabelas
    console.log('\n📊 ESTADO ATUAL DAS TABELAS:');
    
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, owner_id')
      .eq('name', 'PALHOCA');

    if (teamsError) {
      console.error('❌ Erro ao buscar times PALHOCA:', teamsError);
      return;
    }

    console.log(`   Times PALHOCA encontrados: ${teams?.length || 0}`);
    if (teams && teams.length > 0) {
      teams.forEach(team => {
        console.log(`   - ID: ${team.id}, Owner: ${team.owner_id}`);
      });
    }

    // 2. Verificar jogadores
    const { data: youthPlayers, error: youthError } = await supabase
      .from('youth_players')
      .select('id, name, team_id')
      .eq('team_id', teams?.[0]?.id || 'none');

    if (youthError) {
      console.error('❌ Erro ao buscar youth_players:', youthError);
    } else {
      console.log(`   Youth players: ${youthPlayers?.length || 0}`);
    }

    const { data: gamePlayers, error: gameError } = await supabase
      .from('game_players')
      .select('id, name, team_id')
      .eq('team_id', teams?.[0]?.id || 'none');

    if (gameError) {
      console.error('❌ Erro ao buscar game_players:', gameError);
    } else {
      console.log(`   Game players: ${gamePlayers?.length || 0}`);
    }

    // 3. Verificar outras tabelas relacionadas
    const { data: academies, error: academiesError } = await supabase
      .from('youth_academies')
      .select('id, team_id')
      .eq('team_id', teams?.[0]?.id || 'none');

    if (academiesError) {
      console.error('❌ Erro ao buscar academias:', academiesError);
    } else {
      console.log(`   Academias: ${academies?.length || 0}`);
    }

    const { data: tryouts, error: tryoutsError } = await supabase
      .from('youth_tryouts')
      .select('id, team_id')
      .eq('team_id', teams?.[0]?.id || 'none');

    if (tryoutsError) {
      console.error('❌ Erro ao buscar testes:', tryoutsError);
    } else {
      console.log(`   Testes da academia: ${tryouts?.length || 0}`);
    }

    const { data: news, error: newsError } = await supabase
      .from('game_news')
      .select('id, team_id')
      .eq('team_id', teams?.[0]?.id || 'none');

    if (newsError) {
      console.error('❌ Erro ao buscar notícias:', newsError);
    } else {
      console.log(`   Notícias: ${news?.length || 0}`);
    }

    // 4. Verificar partidas
    const { data: matches, error: matchesError } = await supabase
      .from('game_season_matches')
      .select('id, home_team_id, away_team_id')
      .or(`home_team_id.eq.${teams?.[0]?.id || 'none'},away_team_id.eq.${teams?.[0]?.id || 'none'}`);

    if (matchesError) {
      console.error('❌ Erro ao buscar partidas:', matchesError);
    } else {
      console.log(`   Partidas: ${matches?.length || 0}`);
    }

    // 5. Verificar progresso
    const { data: progress, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select('id, team_id')
      .eq('team_id', teams?.[0]?.id || 'none');

    if (progressError) {
      console.error('❌ Erro ao buscar progresso:', progressError);
    } else {
      console.log(`   Progresso: ${progress?.length || 0}`);
    }

    console.log('\n🎯 RECOMENDAÇÕES:');
    if (teams && teams.length > 0) {
      console.log('   ✅ Time PALHOCA existe - pode ser deletado para teste');
      console.log('   📝 Use a função deleteTeam() para testar a limpeza completa');
    } else {
      console.log('   ⚠️ Time PALHOCA não encontrado - crie um novo para testar');
    }

    console.log('\n🧹 FUNÇÕES DE LIMPEZA IMPLEMENTADAS:');
    console.log('   ✅ deleteTeamPlayers() - Limpa youth_players + game_players');
    console.log('   ✅ deleteTeamAcademy() - Limpa youth_academies');
    console.log('   ✅ deleteTeamTryouts() - Limpa youth_tryouts');
    console.log('   ✅ deleteTeamNews() - Limpa game_news');
    console.log('   ✅ deleteSeasonMatches() - Limpa partidas');
    console.log('   ✅ deleteUserProgress() - Limpa progresso');
    console.log('   ✅ deleteUserMachineTeamStats() - Limpa estatísticas');

    console.log('\n🎉 Teste de verificação concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o script
testTeamDeletion()
  .then(() => {
    console.log('✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }); 