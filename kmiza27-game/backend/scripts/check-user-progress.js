const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function checkUserProgress() {
  try {
    console.log('🔍 Verificando progresso do usuário...\n');
    
    const userId = '3b904fbb-b3c9-4d83-9620-4d2941cba0a6';
    
    // Buscar todos os registros de progresso
    const { data: progressList, error } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('user_id', userId)
      .order('season_year', { ascending: false });

    if (error) {
      console.log('❌ Erro:', error.message);
      return;
    }

    if (progressList && progressList.length > 0) {
      console.log(`✅ Encontrados ${progressList.length} registros de progresso:`);
      progressList.forEach((progress, index) => {
        console.log(`\n${index + 1}. Temporada ${progress.season_year} - Série ${progress.current_tier}`);
        console.log(`   Status: ${progress.season_status}`);
        console.log(`   Jogos: ${progress.games_played}`);
        console.log(`   Pontos: ${progress.points}`);
        console.log(`   Posição: ${progress.position}`);
        console.log(`   Time ID: ${progress.team_id}`);
        console.log(`   Criado: ${progress.created_at}`);
        console.log(`   Atualizado: ${progress.updated_at}`);
      });
    } else {
      console.log('⚠️ Nenhum progresso encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUserProgress().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro no script:', error);
  process.exit(1);
}); 