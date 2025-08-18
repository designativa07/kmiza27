const { getSupabaseClient } = require('../config/supabase-connection.js');

console.log('🔌 Testando conexão simples...');

try {
  const supabase = getSupabaseClient('vps');
  console.log('✅ Cliente Supabase criado');
  
  // Teste simples de conexão
  supabase
    .from('youth_players')
    .select('count(*)', { count: 'exact', head: true })
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Erro na consulta:', error.message);
      } else {
        console.log('✅ Consulta bem-sucedida');
        console.log('📊 Resultado:', data);
      }
    })
    .catch(err => {
      console.log('❌ Erro na promise:', err.message);
    });
    
} catch (error) {
  console.log('❌ Erro ao criar cliente:', error.message);
}
