const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function testSingleInsert() {
  console.log('🧪 TESTANDO INSERÇÃO DE UM JOGADOR');
  console.log('===================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // Dados do jogador de teste
    const testPlayer = {
      id: 'test-player-' + Date.now(),
      name: 'Jogador Teste',
      position: 'GK',
      birth_date: '2000-01-01',
      nationality: 'Brasil',
      team_id: '108169aa-feda-419a-bbd8-855bb796f43c', // Real Brasília
      potential: 70,
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

    console.log('📝 Tentando inserir jogador...');
    console.log('🔧 Dados:', JSON.stringify(testPlayer, null, 2));

    const { data, error } = await supabase
      .from('youth_players')
      .insert(testPlayer)
      .select();

    if (error) {
      console.log('❌ Erro na inserção:', error.message);
      console.log('🔍 Código:', error.code);
      console.log('📝 Detalhes:', error.details);
      console.log('💡 Dica:', error.hint);
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📊 Jogador criado:', data[0]);
      
      // Verificar se realmente foi inserido
      const { data: verifyData, error: verifyError } = await supabase
        .from('youth_players')
        .select('*')
        .eq('id', testPlayer.id);

      if (verifyError) {
        console.log('❌ Erro ao verificar inserção:', verifyError.message);
      } else {
        console.log('✅ Verificação confirmada:', verifyData.length, 'jogador encontrado');
      }

      // Limpar o jogador de teste
      const { error: deleteError } = await supabase
        .from('youth_players')
        .delete()
        .eq('id', testPlayer.id);

      if (deleteError) {
        console.log('⚠️ Erro ao limpar teste:', deleteError.message);
      } else {
        console.log('🧹 Jogador de teste removido');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testSingleInsert();
