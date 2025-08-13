const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura das tabelas...\n');
    
    // Verificar game_teams
    console.log('📋 Tabela game_teams:');
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('*')
      .limit(1);

    if (teamsError) {
      console.log('❌ Erro:', teamsError.message);
    } else if (teams && teams.length > 0) {
      console.log('✅ Colunas disponíveis:', Object.keys(teams[0]));
      console.log('   Exemplo de dados:', teams[0]);
    }

    console.log('\n📋 Tabela game_users:');
    const { data: users, error: usersError } = await supabase
      .from('game_users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ Erro:', usersError.message);
    } else if (users && users.length > 0) {
      console.log('✅ Colunas disponíveis:', Object.keys(users[0]));
      console.log('   Exemplo de dados:', users[0]);
    }

    console.log('\n📋 Tabela game_user_competition_progress:');
    const { data: progress, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .limit(1);

    if (progressError) {
      console.log('❌ Erro:', progressError.message);
    } else if (progress && progress.length > 0) {
      console.log('✅ Colunas disponíveis:', Object.keys(progress[0]));
      console.log('   Exemplo de dados:', progress[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTableStructure().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no script:', error);
  process.exit(1);
});
