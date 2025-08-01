const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🔍 VERIFICANDO TIMES DO USUÁRIO');
console.log('=' .repeat(40));

async function checkUserTeams() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Verificar todos os times
    console.log('\n📋 1. Verificando todos os times...');
    const { data: allTeams, error: allError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, owner_id');
    
    if (allError) {
      console.log('❌ Erro ao buscar todos os times:', allError.message);
      return;
    }
    
    console.log(`📊 Total de times: ${allTeams.length}`);
    
    // Separar por tipo
    const userTeams = allTeams.filter(team => team.team_type === 'user_created');
    const machineTeams = allTeams.filter(team => team.team_type === 'machine');
    const otherTeams = allTeams.filter(team => !['user_created', 'machine'].includes(team.team_type));
    
    console.log(`👤 Times do usuário: ${userTeams.length}`);
    console.log(`🤖 Times da máquina: ${machineTeams.length}`);
    console.log(`❓ Outros tipos: ${otherTeams.length}`);
    
    // Verificar times do usuário específico
    console.log('\n📋 2. Verificando times do usuário padrão...');
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    
    const { data: userTeamsFiltered, error: userError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, owner_id')
      .eq('owner_id', userId)
      .eq('team_type', 'user_created');
    
    if (userError) {
      console.log('❌ Erro ao buscar times do usuário:', userError.message);
      return;
    }
    
    console.log(`📊 Times do usuário ${userId}: ${userTeamsFiltered.length}`);
    
    if (userTeamsFiltered.length > 0) {
      console.log('📋 Lista de times do usuário:');
      userTeamsFiltered.forEach(team => {
        console.log(`  - ${team.name} (${team.team_type})`);
      });
    } else {
      console.log('📋 Nenhum time do usuário encontrado');
    }
    
    // Verificar se há times da máquina com o mesmo owner_id
    console.log('\n📋 3. Verificando times da máquina com mesmo owner_id...');
    const { data: machineTeamsSameOwner, error: machineError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, owner_id')
      .eq('owner_id', userId)
      .eq('team_type', 'machine');
    
    if (machineError) {
      console.log('❌ Erro ao buscar times da máquina:', machineError.message);
      return;
    }
    
    console.log(`📊 Times da máquina com mesmo owner_id: ${machineTeamsSameOwner.length}`);
    
    if (machineTeamsSameOwner.length > 0) {
      console.log('⚠️  ATENÇÃO: Encontrados times da máquina com mesmo owner_id!');
      machineTeamsSameOwner.forEach(team => {
        console.log(`  - ${team.name} (${team.team_type})`);
      });
    }
    
    console.log('\n✅ Verificação concluída!');
    console.log('💡 A correção deve ter funcionado se não há times da máquina na lista do usuário');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar verificação
if (require.main === module) {
  checkUserTeams();
}

module.exports = {
  checkUserTeams
}; 