const { getSupabaseClient } = require('../config/supabase-connection');

async function testInsertLog() {
  try {
    console.log('🧪 Testando inserção de log na tabela game_academy_logs...');
    
    const supabase = getSupabaseClient('vps');
    
    // Tentar inserir um log de teste
    const testLog = {
      team_id: '2abd2e67-8563-466e-995f-e9e619cf6e46',
      player_id: 'fa13230c-368f-4518-aeba-734f7821debd',
      player_name: 'Bruno Souza (Teste)',
      week: '2025-08-15',
      focus: 'PAC',
      intensity: 'normal',
      total_points: 15.5,
      attribute_gains: { pace: 2, shooting: 1, passing: 1 },
      injury_result: { injured: false, severity: null }
    };
    
    console.log('📝 Tentando inserir log:', testLog);
    
    const { data, error } = await supabase
      .from('game_academy_logs')
      .insert(testLog)
      .select();
    
    if (error) {
      console.log('❌ Erro ao inserir log:', error);
      
      // Verificar estrutura da tabela
      console.log('🔍 Verificando estrutura da tabela...');
      const { data: columns, error: columnsError } = await supabase
        .from('game_academy_logs')
        .select('*')
        .limit(1);
      
      if (columnsError) {
        console.log('❌ Erro ao verificar estrutura:', columnsError);
      } else {
        console.log('✅ Estrutura da tabela:', Object.keys(columns[0] || {}));
      }
      
    } else {
      console.log('✅ Log inserido com sucesso:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testInsertLog().then(() => process.exit(0)).catch(() => process.exit(1));
