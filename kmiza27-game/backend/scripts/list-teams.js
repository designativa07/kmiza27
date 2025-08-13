const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function listTeams() {
  try {
    console.log('⚽ Listando times...');
    
    const { data: teams, error } = await supabase
      .from('game_teams')
      .select('id, name, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.log('❌ Erro:', error.message);
      return;
    }

    if (teams && teams.length > 0) {
      console.log(`✅ Encontrados ${teams.length} times:`);
      teams.forEach((team, index) => {
        console.log(`   ${index + 1}. ${team.name} (ID: ${team.id})`);
        console.log(`      Usuário ID: ${team.user_id}`);
        console.log(`      Criado: ${team.created_at}`);
      });
    } else {
      console.log('⚠️ Nenhum time encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

listTeams().then(() => {
  console.log('🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no script:', error);
  process.exit(1);
});
