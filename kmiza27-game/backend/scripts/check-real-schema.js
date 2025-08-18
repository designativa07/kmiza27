const { getSupabaseClient } = require('../config/supabase-connection.js');

async function checkRealSchema() {
  console.log('🔍 VERIFICANDO ESTRUTURA REAL DA TABELA');
  console.log('========================================\n');

  const supabase = getSupabaseClient('vps');

  try {
    // Tentar inserir dados mínimos para ver quais colunas são obrigatórias
    console.log('📋 Testando inserção com dados mínimos...');
    
    const minimalPlayer = {
      id: 'test-minimal-' + Date.now(),
      name: 'Teste Mínimo'
    };

    const { data, error } = await supabase
      .from('youth_players')
      .insert(minimalPlayer)
      .select();

    if (error) {
      console.log('❌ Erro com dados mínimos:', error.message);
      console.log('🔍 Código:', error.code);
      
      if (error.code === '23502') {
        console.log('📝 Erro de NOT NULL - coluna obrigatória não preenchida');
        console.log('💡 Detalhes:', error.details);
      }
    } else {
      console.log('✅ Inserção mínima funcionou');
    }

    // Tentar ver a estrutura da tabela
    console.log('\n📋 Verificando estrutura da tabela...');
    const { data: structureData, error: structureError } = await supabase
      .from('youth_players')
      .select('*')
      .limit(0); // Sem dados, só estrutura

    if (structureError) {
      console.log('❌ Erro ao verificar estrutura:', structureError.message);
    } else {
      console.log('✅ Estrutura acessível');
      // Tentar ver as colunas disponíveis
      console.log('🔧 Tentando descobrir colunas...');
      
      // Testar colunas comuns
      const testColumns = [
        'id', 'name', 'position', 'birth_date', 'birth_year', 'age',
        'nationality', 'team_id', 'potential', 'attributes', 'status',
        'is_youth', 'foot', 'personality', 'style', 'salary'
      ];
      
      for (const col of testColumns) {
        try {
          const { error: colError } = await supabase
            .from('youth_players')
            .select(col)
            .limit(1);
          
          if (colError) {
            console.log(`  ❌ ${col}: ${colError.message}`);
          } else {
            console.log(`  ✅ ${col}: Disponível`);
          }
        } catch (err) {
          console.log(`  ❌ ${col}: Erro`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkRealSchema();
