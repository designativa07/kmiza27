const { getSupabaseClient } = require('../config/supabase-connection');

async function createFixScript(tableName = 'game_matches', columnName = 'finished_at') {
  try {
    console.log(`🔧 Criando script de correção para ${tableName}.${columnName}...`);
    
    const supabase = getSupabaseClient('vps');
    
    // Verificar se a tabela existe
    const { data: records, error: tableError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log(`❌ Tabela ${tableName} não existe`);
      return;
    }
    
    // Verificar se a coluna já existe
    if (records && records.length > 0) {
      const sampleRecord = records[0];
      const hasColumn = columnName in sampleRecord;
      
      if (hasColumn) {
        console.log(`✅ Coluna ${columnName} já existe na tabela ${tableName}`);
        return;
      }
    }
    
    // Gerar script SQL
    const sqlScript = `
-- Script para adicionar coluna ${columnName} à tabela ${tableName}
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna se não existir
ALTER TABLE ${tableName} 
ADD COLUMN IF NOT EXISTS ${columnName} TIMESTAMP WITH TIME ZONE;

-- Verificar se a coluna foi adicionada
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = '${tableName}' 
AND column_name = '${columnName}';

-- Mensagem de sucesso
SELECT '✅ Coluna ${columnName} adicionada com sucesso!' as status;
    `;
    
    console.log('📄 Script SQL gerado:');
    console.log('='.repeat(60));
    console.log(sqlScript);
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 Para aplicar esta correção:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole o script acima');
    console.log('4. Execute o script');
    console.log('5. Teste a funcionalidade novamente');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Permitir especificar tabela e coluna via argumentos
const tableName = process.argv[2] || 'game_matches';
const columnName = process.argv[3] || 'finished_at';

createFixScript(tableName, columnName); 