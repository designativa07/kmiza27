const { getSupabaseClient } = require('../config/supabase-connection');

async function fixRoundsConstraint() {
  try {
    console.log('🔧 Corrigindo constraint da tabela game_rounds...');
    
    const supabase = getSupabaseClient('vps');
    
    // Verificar estrutura atual da tabela
    console.log('📋 Verificando estrutura da tabela game_rounds...');
    
    try {
      const { data, error } = await supabase
        .from('game_rounds')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Erro ao acessar tabela: ${error.message}`);
      } else {
        console.log('✅ Tabela game_rounds acessível');
        if (data && data.length > 0) {
          console.log('📋 Colunas disponíveis:', Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`❌ Tabela não existe: ${err.message}`);
    }
    
    // Script SQL para corrigir a constraint
    const fixScript = `
-- Verificar constraint atual
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'game_rounds'::regclass 
AND contype = 'c';

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
    
    console.log('\n📄 Script SQL para executar no Supabase:');
    console.log(fixScript);
    
    console.log('\n🎯 Para aplicar a correção:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole o script acima');
    console.log('4. Execute o script');
    console.log('5. Execute novamente o script de implementação da FASE 2');
    
  } catch (error) {
    console.error('❌ Erro ao verificar constraint:', error);
  }
}

fixRoundsConstraint(); 