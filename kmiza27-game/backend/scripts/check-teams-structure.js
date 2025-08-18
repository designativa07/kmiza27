const { getSupabaseClient } = require('../config/supabase-connection.js');

async function checkTeamsStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA GAME_TEAMS');
  console.log('==============================================\n');

  const supabase = getSupabaseClient('vps');

  try {
    // Verificar estrutura da tabela
    console.log('📋 Verificando estrutura da tabela...');
    const { data: teamsData, error: teamsError } = await supabase
      .from('game_teams')
      .select('*')
      .limit(3);

    if (teamsError) {
      console.log('❌ Erro ao acessar game_teams:', teamsError.message);
      return;
    }

    console.log('✅ game_teams acessível');
    console.log('📊 Times encontrados:', teamsData?.length || 0);
    
    if (teamsData && teamsData.length > 0) {
      console.log('\n🔧 Colunas disponíveis:');
      Object.keys(teamsData[0]).forEach(col => {
        console.log(`  • ${col}: ${typeof teamsData[0][col]}`);
      });

      console.log('\n📋 Primeiros times:');
      teamsData.forEach(team => {
        console.log(`  • ${team.name} (ID: ${team.id})`);
        // Mostrar algumas colunas importantes
        if (team.user_id) console.log(`    - user_id: ${team.user_id}`);
        if (team.owner_id) console.log(`    - owner_id: ${team.owner_id}`);
        if (team.is_ai) console.log(`    - is_ai: ${team.is_ai}`);
        if (team.ai_controlled) console.log(`    - ai_controlled: ${team.ai_controlled}`);
        if (team.type) console.log(`    - type: ${team.type}`);
        console.log('');
      });
    }

    // Tentar descobrir como identificar times da IA
    console.log('🔍 Tentando identificar times da IA...');
    
    // Verificar se há coluna user_id nula (indicando time da IA)
    const { data: aiTeams, error: aiError } = await supabase
      .from('game_teams')
      .select('id, name, user_id')
      .is('user_id', null);

    if (aiError) {
      console.log('❌ Erro ao buscar times sem user_id:', aiError.message);
    } else {
      console.log(`✅ Times sem user_id (possivelmente IA): ${aiTeams?.length || 0}`);
      if (aiTeams && aiTeams.length > 0) {
        aiTeams.forEach(team => {
          console.log(`  • ${team.name} (ID: ${team.id})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTeamsStructure();
