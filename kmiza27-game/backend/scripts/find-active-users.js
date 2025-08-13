const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function findActiveUsers() {
  try {
    console.log('🔍 Procurando usuários com progresso ativo...\n');
    
    // Buscar usuários com progresso ativo
    const { data: activeProgress, error } = await supabase
      .from('game_user_competition_progress')
      .select(`
        *,
        user:game_users!user_id(username, email),
        team:game_teams!team_id(name)
      `)
      .eq('season_status', 'active')
      .order('games_played', { ascending: false })
      .limit(10);

    if (error) {
      console.log('❌ Erro:', error.message);
      return;
    }

    if (activeProgress && activeProgress.length > 0) {
      console.log(`✅ Encontrados ${activeProgress.length} usuários com progresso ativo:`);
      activeProgress.forEach((progress, index) => {
        console.log(`\n${index + 1}. Usuário: ${progress.user?.username || 'N/A'}`);
        console.log(`   Time: ${progress.team?.name || 'N/A'}`);
        console.log(`   Série: ${progress.current_tier}, Temporada: ${progress.season_year}`);
        console.log(`   Jogos: ${progress.games_played}, Pontos: ${progress.points}`);
        console.log(`   Posição: ${progress.position}`);
        console.log(`   User ID: ${progress.user_id}`);
        console.log(`   Team ID: ${progress.team_id}`);
      });
    } else {
      console.log('⚠️ Nenhum usuário com progresso ativo encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

findActiveUsers().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no script:', error);
  process.exit(1);
});
