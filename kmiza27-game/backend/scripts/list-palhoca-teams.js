const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function listPalhocaTeams() {
  try {
    console.log('🔍 Listando todos os times com nome Palhoça...\n');
    
    const { data: teams, error } = await supabase
      .from('game_teams')
      .select('*')
      .ilike('name', '%Palhoça%')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Erro:', error.message);
      return;
    }

    if (teams && teams.length > 0) {
      console.log(`✅ Encontrados ${teams.length} times:`);
      teams.forEach((team, index) => {
        console.log(`\n${index + 1}. ${team.name} (ID: ${team.id})`);
        console.log(`   Owner ID: ${team.owner_id}`);
        console.log(`   Tipo: ${team.team_type}`);
        console.log(`   Criado: ${team.created_at}`);
        console.log(`   Atualizado: ${team.updated_at}`);
      });
    } else {
      console.log('⚠️ Nenhum time encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

listPalhocaTeams().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no script:', error);
  process.exit(1);
});
