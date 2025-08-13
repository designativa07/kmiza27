const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function listUsers() {
  try {
    console.log('👥 Listando usuários...');
    
    const { data: users, error } = await supabase
      .from('game_users')
      .select('id, username, email, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.log('❌ Erro:', error.message);
      return;
    }

    if (users && users.length > 0) {
      console.log(`✅ Encontrados ${users.length} usuários:`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (ID: ${user.id}) - ${user.email}`);
      });
    } else {
      console.log('⚠️ Nenhum usuário encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

listUsers().then(() => {
  console.log('🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no script:', error);
  process.exit(1);
});
