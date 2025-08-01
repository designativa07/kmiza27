const { getSupabaseClient } = require('../config/supabase-connection');

async function checkMatchesStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela game_matches...');
    
    const supabase = getSupabaseClient('vps');
    
    // Verificar estrutura atual
    try {
      const { data, error } = await supabase
        .from('game_matches')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Erro ao acessar tabela: ${error.message}`);
      } else {
        console.log('✅ Tabela game_matches acessível');
        if (data && data.length > 0) {
          console.log('📋 Colunas disponíveis:', Object.keys(data[0]));
        } else {
          console.log('📋 Tabela vazia, verificando estrutura via query...');
          
          // Tentar inserir um registro de teste para ver a estrutura
          const { data: testData, error: testError } = await supabase
            .from('game_matches')
            .insert({
              home_team_id: '00000000-0000-0000-0000-000000000001',
              away_team_id: '00000000-0000-0000-0000-000000000002',
              status: 'scheduled',
              match_date: new Date().toISOString()
            })
            .select()
            .single();
          
          if (testError) {
            console.log(`❌ Erro ao inserir teste: ${testError.message}`);
          } else {
            console.log('✅ Estrutura verificada:', Object.keys(testData));
            
            // Limpar teste
            await supabase
              .from('game_matches')
              .delete()
              .eq('home_team_id', '00000000-0000-0000-0000-000000000001');
          }
        }
      }
    } catch (err) {
      console.log(`❌ Tabela não existe: ${err.message}`);
    }
    
    // Verificar se precisamos adicionar coluna competition_id
    console.log('\n🔧 Verificando necessidade de adicionar competition_id...');
    
    const addColumnScript = `
-- Adicionar coluna competition_id se não existir
ALTER TABLE game_matches 
ADD COLUMN IF NOT EXISTS competition_id UUID REFERENCES game_competitions(id);

-- Verificar se foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_matches' 
AND column_name = 'competition_id';
    `;
    
    console.log('\n📄 Script SQL para executar no Supabase:');
    console.log(addColumnScript);
    
    console.log('\n🎯 Para aplicar a correção:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole o script acima');
    console.log('4. Execute o script');
    console.log('5. Execute novamente o script de implementação da FASE 2');
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
  }
}

checkMatchesStructure(); 