const { getSupabaseClient } = require('../config/supabase-connection');

async function addFinishedAtColumn() {
  try {
    console.log('🔧 Adicionando coluna finished_at à tabela game_matches...');
    
    const supabase = getSupabaseClient('vps');
    
    // Tentar adicionar a coluna finished_at
    const { error } = await supabase
      .from('game_matches')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela game_matches:', error);
      return;
    }
    
    console.log('✅ Tabela game_matches está acessível');
    
    // Como não podemos executar DDL via Supabase client, vamos criar um script SQL
    console.log('📝 Criando script SQL para adicionar a coluna...');
    
    const sqlScript = `
-- Script para adicionar coluna finished_at
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna finished_at se não existir
ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE;

-- Verificar se a coluna foi adicionada
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
AND column_name = 'finished_at';

-- Mensagem de sucesso
SELECT '✅ Coluna finished_at adicionada com sucesso!' as status;
    `;
    
    console.log('📄 Script SQL criado:');
    console.log('='.repeat(50));
    console.log(sqlScript);
    console.log('='.repeat(50));
    console.log('');
    console.log('💡 Para aplicar esta correção:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole o script acima');
    console.log('4. Execute o script');
    console.log('5. Teste o simulador novamente');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

addFinishedAtColumn(); 