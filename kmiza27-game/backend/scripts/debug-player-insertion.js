const { getSupabaseClient } = require('../config/supabase-connection.js');

async function debugPlayerInsertion() {
  console.log('🔍 DEBUG: INVESTIGANDO INSERÇÃO DE JOGADORES');
  console.log('============================================\n');

  const supabase = getSupabaseClient('vps');

  try {
    // 1. Verificar se conseguimos conectar
    console.log('🔌 1. Testando conexão...');
    const { data: testData, error: testError } = await supabase
      .from('youth_players')
      .select('count(*)', { count: 'exact', head: true });

    if (testError) {
      console.log('❌ Erro de conexão:', testError.message);
      return;
    }
    console.log('✅ Conexão funcionando');

    // 2. Verificar estrutura da tabela youth_players
    console.log('\n📋 2. Verificando estrutura de youth_players...');
    const { data: structureData, error: structureError } = await supabase
      .from('youth_players')
      .select('*')
      .limit(1);

    if (structureError) {
      console.log('❌ Erro ao acessar estrutura:', structureError.message);
    } else {
      console.log('✅ Tabela acessível');
      if (structureData && structureData.length > 0) {
        console.log('🔧 Colunas disponíveis:', Object.keys(structureData[0]));
      }
    }

    // 3. Tentar inserir um jogador de teste
    console.log('\n🧪 3. Testando inserção de um jogador...');
    const testPlayer = {
      id: 'test-player-' + Date.now(),
      name: 'Jogador Teste',
      position: 'GK',
      birth_date: '2000-01-01',
      nationality: 'Brasil',
      team_id: '108169aa-feda-419a-bbd8-855bb796f43c', // Real Brasília
      potential: 70, // Adicionando valor para potential
      attributes: { pace: 50, passing: 50, physical: 50, shooting: 50, defending: 50, dribbling: 50 },
      status: 'available',
      age: 25,
      is_youth: true,
      foot: 'R',
      personality: 'normal',
      style: 'mixed',
      salary: 10000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('youth_players')
      .insert(testPlayer)
      .select();

    if (insertError) {
      console.log('❌ Erro na inserção de teste:', insertError.message);
      console.log('🔍 Código do erro:', insertError.code);
      console.log('📝 Detalhes:', insertError.details);
    } else {
      console.log('✅ Inserção de teste bem-sucedida!');
      console.log('📊 Jogador inserido:', insertData[0].id);
      
      // Limpar o jogador de teste
      await supabase
        .from('youth_players')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Jogador de teste removido');
    }

    // 4. Verificar se há jogadores existentes
    console.log('\n👥 4. Verificando jogadores existentes...');
    const { count: youthCount, error: countError } = await supabase
      .from('youth_players')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Erro ao contar jogadores:', countError.message);
    } else {
      console.log(`📊 Total de jogadores na base: ${youthCount || 0}`);
    }

    // 5. Verificar se há algum problema com RLS
    console.log('\n🔒 5. Verificando RLS...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('youth_players')
      .select('id, name')
      .limit(5);

    if (rlsError) {
      console.log('❌ Erro de RLS:', rlsError.message);
    } else {
      console.log('✅ RLS funcionando, dados acessíveis');
      if (rlsData && rlsData.length > 0) {
        console.log('📋 Primeiros jogadores:', rlsData.map(p => ({ id: p.id, name: p.name })));
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugPlayerInsertion();
