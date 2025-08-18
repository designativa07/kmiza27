const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function verifyPlayersInserted() {
  console.log('🔍 VERIFICANDO SE OS JOGADORES FORAM INSERIDOS');
  console.log('==============================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // Verificar youth_players
    console.log('📋 Verificando youth_players...');
    const { data: youthData, error: youthError, count: youthCount } = await supabase
      .from('youth_players')
      .select('*', { count: 'exact' })
      .limit(5);

    if (youthError) {
      console.log('❌ Erro ao acessar youth_players:', youthError.message);
    } else {
      console.log(`✅ youth_players acessível`);
      console.log(`📊 Total de registros: ${youthCount || 0}`);
      
      if (youthData && youthData.length > 0) {
        console.log('🔧 Primeiros jogadores:');
        youthData.forEach((player, index) => {
          console.log(`  ${index + 1}. ${player.name} (${player.position}) - Time: ${player.team_id}`);
        });
      }
    }

    // Verificar game_players
    console.log('\n📋 Verificando game_players...');
    const { data: gameData, error: gameError, count: gameCount } = await supabase
      .from('game_players')
      .select('*', { count: 'exact' })
      .limit(5);

    if (gameError) {
      console.log('❌ Erro ao acessar game_players:', gameError.message);
    } else {
      console.log(`✅ game_players acessível`);
      console.log(`📊 Total de registros: ${gameCount || 0}`);
      
      if (gameData && gameData.length > 0) {
        console.log('🔧 Primeiros jogadores:');
        gameData.forEach((player, index) => {
          console.log(`  ${index + 1}. ${player.name} (${player.position}) - Time: ${player.team_id}`);
        });
      }
    }

    // Verificar se há jogadores para um time específico
    console.log('\n🔍 Verificando jogadores do Real Brasília...');
    const { data: realBrasiliaPlayers, error: rbError } = await supabase
      .from('youth_players')
      .select('id, name, position')
      .eq('team_id', '108169aa-feda-419a-bbd8-855bb796f43c')
      .limit(5);

    if (rbError) {
      console.log('❌ Erro ao buscar jogadores do Real Brasília:', rbError.message);
    } else {
      console.log(`📊 Jogadores do Real Brasília: ${realBrasiliaPlayers?.length || 0}`);
      if (realBrasiliaPlayers && realBrasiliaPlayers.length > 0) {
        realBrasiliaPlayers.forEach((player, index) => {
          console.log(`  ${index + 1}. ${player.name} (${player.position})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

verifyPlayersInserted();
