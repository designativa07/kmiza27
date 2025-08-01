const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function applyRoundsFix() {
  try {
    console.log('🔧 Aplicando correção da constraint game_rounds...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    // Script SQL para corrigir a constraint
    const fixScript = `
-- Remover constraint problemática (se existir)
ALTER TABLE game_rounds DROP CONSTRAINT IF EXISTS game_rounds_status_check;

-- Adicionar constraint correta
ALTER TABLE game_rounds ADD CONSTRAINT game_rounds_status_check 
CHECK (status IN ('pending', 'active', 'completed', 'cancelled'));

-- Verificar se a constraint foi aplicada
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'game_rounds'::regclass 
AND contype = 'c';
    `;
    
    console.log('📄 Executando correção...');
    
    // Executar via RPC (se disponível)
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: fixScript });
      
      if (error) {
        console.log(`❌ Erro ao executar via RPC: ${error.message}`);
        console.log('📋 Execute manualmente no Supabase Dashboard:');
        console.log(fixScript);
      } else {
        console.log('✅ Correção aplicada com sucesso!');
        console.log('📊 Resultado:', data);
      }
    } catch (rpcError) {
      console.log('⚠️ RPC não disponível, execute manualmente:');
      console.log(fixScript);
    }
    
    // Testar se a correção funcionou
    console.log('\n🧪 Testando correção...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('game_rounds')
        .insert({
          competition_id: 'test-competition-id',
          round_number: 999,
          name: 'Test Round',
          status: 'pending'
        })
        .select()
        .single();
      
      if (testError) {
        console.log(`❌ Teste falhou: ${testError.message}`);
      } else {
        console.log('✅ Teste passou! Status "pending" aceito');
        
        // Limpar teste
        await supabase
          .from('game_rounds')
          .delete()
          .eq('name', 'Test Round');
        
        console.log('🧹 Teste limpo');
      }
    } catch (testErr) {
      console.log(`❌ Erro no teste: ${testErr.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar correção:', error);
  }
}

applyRoundsFix(); 