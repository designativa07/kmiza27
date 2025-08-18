const { getSupabaseClient } = require('../config/supabase-connection.js');

async function checkTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS');
  console.log('=====================================\n');

  const supabase = getSupabaseClient('vps');

  try {
    // Verificar youth_players
    console.log('📋 Verificando tabela youth_players...');
    const { data: youthData, error: youthError } = await supabase
      .from('youth_players')
      .select('*')
      .limit(1);

    if (youthError) {
      console.log('❌ Erro ao acessar youth_players:', youthError.message);
    } else if (youthData && youthData.length > 0) {
      console.log('✅ youth_players acessível');
      console.log('📊 Total de registros:', youthData.length);
      console.log('🔧 Colunas disponíveis:', Object.keys(youthData[0]));
    } else {
      console.log('⚠️ youth_players vazia ou sem dados');
    }

    console.log('\n📋 Verificando tabela game_players...');
    const { data: gameData, error: gameError } = await supabase
      .from('game_players')
      .select('*')
      .limit(1);

    if (gameError) {
      console.log('❌ Erro ao acessar game_players:', gameError.message);
    } else if (gameData && gameData.length > 0) {
      console.log('✅ game_players acessível');
      console.log('📊 Total de registros:', gameData.length);
      console.log('🔧 Colunas disponíveis:', Object.keys(gameData[0]));
    } else {
      console.log('⚠️ game_players vazia ou sem dados');
    }

    // Verificar se há jogadores
    console.log('\n👥 Verificando total de jogadores...');
    const { count: youthCount } = await supabase
      .from('youth_players')
      .select('*', { count: 'exact', head: true });

    const { count: gameCount } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total youth_players: ${youthCount || 0}`);
    console.log(`📊 Total game_players: ${gameCount || 0}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTableStructure();
