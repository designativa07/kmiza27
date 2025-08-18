const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function checkTeamsList() {
  console.log('🔍 VERIFICANDO LISTA DE TIMES');
  console.log('==============================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    const { data: teams, error } = await supabase
      .from('game_teams')
      .select('name, team_type')
      .order('name');

    if (error) {
      console.log('❌ Erro ao buscar times:', error.message);
      return;
    }

    console.log(`📊 Total de times encontrados: ${teams?.length || 0}\n`);
    
    console.log('🏟️  TIMES DA MÁQUINA:');
    console.log('=======================');
    const machineTeams = teams?.filter(t => t.team_type === 'machine') || [];
    machineTeams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.name}`);
    });

    console.log(`\n📈 RESUMO:`);
    console.log(`   • Times da máquina: ${machineTeams.length}`);
    console.log(`   • Outros tipos: ${teams?.length - machineTeams.length}`);
    console.log(`   • Total: ${teams?.length}`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTeamsList();
