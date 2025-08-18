const { getSupabaseClient } = require('../config/supabase-connection.js');

async function testOtherTables() {
  console.log('🔍 TESTANDO OUTRAS TABELAS');
  console.log('===========================\n');

  const supabase = getSupabaseClient('vps');

  try {
    // Testar tabela game_teams (que sabemos que existe)
    console.log('📋 1. Testando game_teams...');
    const { data: teamsData, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .limit(3);

    if (teamsError) {
      console.log('❌ Erro em game_teams:', teamsError.message);
    } else {
      console.log('✅ game_teams acessível');
      console.log('📊 Times encontrados:', teamsData?.length || 0);
      if (teamsData && teamsData.length > 0) {
        console.log('   •', teamsData[0].name);
      }
    }

    // Testar tabela game_users
    console.log('\n📋 2. Testando game_users...');
    const { data: usersData, error: usersError } = await supabase
      .from('game_users')
      .select('id, username')
      .limit(3);

    if (usersError) {
      console.log('❌ Erro em game_users:', usersError.message);
    } else {
      console.log('✅ game_users acessível');
      console.log('📊 Usuários encontrados:', usersData?.length || 0);
    }

    // Testar se youth_players existe
    console.log('\n📋 3. Testando youth_players...');
    const { data: youthData, error: youthError } = await supabase
      .from('youth_players')
      .select('id')
      .limit(1);

    if (youthError) {
      console.log('❌ Erro em youth_players:', youthError.message);
      console.log('🔍 Código do erro:', youthError.code);
    } else {
      console.log('✅ youth_players acessível');
      console.log('📊 Jogadores encontrados:', youthData?.length || 0);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testOtherTables();
