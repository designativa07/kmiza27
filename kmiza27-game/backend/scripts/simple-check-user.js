const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

async function checkUser() {
  try {
    console.log('🔍 Verificando usuário PALHOCA...');
    
    const { data: user, error: userError } = await supabase
      .from('game_users')
      .select('*')
      .eq('username', 'PALHOCA')
      .single();

    if (userError) {
      console.log('❌ Erro:', userError.message);
      return;
    }

    console.log('✅ Usuário encontrado:', user.username, 'ID:', user.id);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUser();
