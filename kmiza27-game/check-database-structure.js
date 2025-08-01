const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixDatabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela game_matches...');
    
    // 1. Verificar estrutura atual
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'game_matches')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Erro ao verificar estrutura:', columnsError);
      return;
    }

    console.log('📋 Estrutura atual da tabela game_matches:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 2. Verificar se as colunas necessárias existem
    const requiredColumns = ['home_team_name', 'away_team_name', 'match_date'];
    const existingColumns = columns.map(col => col.column_name);
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`⚠️  Colunas faltando: ${missingColumns.join(', ')}`);
      console.log('🔧 Executando correções...');
      
      // Adicionar colunas faltando
      for (const column of missingColumns) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE game_matches ADD COLUMN IF NOT EXISTS ${column} VARCHAR(255);`
          });
          
          if (error) {
            console.error(`❌ Erro ao adicionar coluna ${column}:`, error);
          } else {
            console.log(`✅ Coluna ${column} adicionada com sucesso`);
          }
        } catch (err) {
          console.error(`❌ Erro ao adicionar coluna ${column}:`, err);
        }
      }
    } else {
      console.log('✅ Todas as colunas necessárias existem');
    }

    // 3. Verificar se existe coluna 'date' e migrar para 'match_date'
    const hasDateColumn = existingColumns.includes('date');
    const hasMatchDateColumn = existingColumns.includes('match_date');
    
    if (hasDateColumn && hasMatchDateColumn) {
      console.log('🔄 Migrando dados da coluna date para match_date...');
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `
            UPDATE game_matches 
            SET match_date = date 
            WHERE match_date IS NULL AND date IS NOT NULL;
          `
        });
        
        if (error) {
          console.error('❌ Erro ao migrar dados:', error);
        } else {
          console.log('✅ Dados migrados com sucesso');
          
          // Remover coluna date
          const { error: dropError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE game_matches DROP COLUMN IF EXISTS date;'
          });
          
          if (dropError) {
            console.error('❌ Erro ao remover coluna date:', dropError);
          } else {
            console.log('✅ Coluna date removida');
          }
        }
      } catch (err) {
        console.error('❌ Erro na migração:', err);
      }
    }

    // 4. Verificar estrutura final
    console.log('\n📋 Estrutura final da tabela game_matches:');
    const { data: finalColumns, error: finalError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'game_matches')
      .order('ordinal_position');

    if (!finalError) {
      finalColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }

    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkAndFixDatabaseStructure();
}

module.exports = { checkAndFixDatabaseStructure }; 