const { createClient } = require('@supabase/supabase-js');

console.log('🚀 Iniciando teste de conexão...');

const supabase = createClient(
  'https://kmiza27-supabase.h4xd66.easypanel.host/',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

console.log('✅ Cliente Supabase criado');

async function testConnection() {
  try {
    console.log('🔍 Testando conexão...');
    
    const { data, error } = await supabase
      .from('game_users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return;
    }

    console.log('✅ Conexão bem-sucedida!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

console.log('📞 Chamando função de teste...');
testConnection().then(() => {
  console.log('🏁 Script finalizado');
}).catch((error) => {
  console.error('💥 Erro no script:', error);
}); 