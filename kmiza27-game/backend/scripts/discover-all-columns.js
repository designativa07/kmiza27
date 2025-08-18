const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function discoverAllColumns() {
  console.log('🔍 DESCOBRINDO TODAS AS COLUNAS');
  console.log('=================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // Tentar inserir um jogador com apenas as colunas que sabemos que existem
    console.log('📋 Testando inserção com colunas conhecidas...');
    
    const testPlayer = {
      id: '00000000-0000-0000-0000-000000000001', // UUID válido
      name: 'Jogador Teste',
      position: 'GK',
      age: 25,
      nationality: 'Brasil',
      team_id: '108169aa-feda-419a-bbd8-855bb796f43c',
      potential: 70,
      attributes: { pace: 50, passing: 50, physical: 50, shooting: 50, defending: 50, dribbling: 50 },
      status: 'available'
    };

    console.log('🔧 Dados de teste:', JSON.stringify(testPlayer, null, 2));

    const { data, error } = await supabase
      .from('youth_players')
      .insert(testPlayer)
      .select();

    if (error) {
      console.log('❌ Erro na inserção:', error.message);
      console.log('🔍 Código:', error.code);
      console.log('📝 Detalhes:', error.details);
      
      if (error.code === '23502') {
        console.log('📋 Colunas obrigatórias faltando. Vamos descobrir...');
        
        // Testar colunas adicionais que podem existir
        const additionalColumns = [
          'created_at', 'updated_at', 'market_status', 'transfer_status',
          'contract_end', 'wage', 'value', 'reputation', 'morale',
          'fitness', 'form', 'experience', 'leadership', 'versatility'
        ];
        
        console.log('\n🔍 Testando colunas adicionais...');
        for (const col of additionalColumns) {
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
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📊 Jogador criado:', data[0]);
      
      // Limpar o jogador de teste
      await supabase
        .from('youth_players')
        .delete()
        .eq('id', testPlayer.id);
      console.log('🧹 Jogador de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

discoverAllColumns();
