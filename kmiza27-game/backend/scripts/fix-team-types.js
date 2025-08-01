const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function fixTeamTypes() {
  try {
    console.log('🔧 Verificando e corrigindo tipos de times...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    // 1. Verificar todos os times
    console.log('\n👥 Verificando todos os times...');
    
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, owner_id')
      .order('name');
    
    if (teamsError) {
      console.error('❌ Erro ao buscar times:', teamsError);
      return;
    }
    
    console.log(`📋 Total de times encontrados: ${teams.length}`);
    
    // 2. Analisar tipos de times
    const teamTypes = {};
    teams.forEach(team => {
      const type = team.team_type || 'undefined';
      if (!teamTypes[type]) {
        teamTypes[type] = [];
      }
      teamTypes[type].push(team);
    });
    
    console.log('\n📊 Distribuição de tipos de times:');
    Object.entries(teamTypes).forEach(([type, teams]) => {
      console.log(`  - ${type}: ${teams.length} times`);
      teams.forEach(team => {
        console.log(`    * ${team.name} (ID: ${team.id})`);
      });
    });
    
    // 3. Identificar times da máquina (baseado no owner_id)
    console.log('\n🤖 Identificando times da máquina...');
    
    const machineUserId = '22fa9e4b-858e-49b5-b80c-1390f9665ac9';
    const machineTeams = teams.filter(team => team.owner_id === machineUserId);
    const userTeams = teams.filter(team => team.owner_id !== machineUserId);
    
    console.log(`  - Times da máquina: ${machineTeams.length}`);
    console.log(`  - Times de usuário: ${userTeams.length}`);
    
    // 4. Corrigir tipos de times
    console.log('\n🔧 Corrigindo tipos de times...');
    
    // Atualizar times da máquina
    for (const team of machineTeams) {
      if (team.team_type !== 'machine') {
        const { error: updateError } = await supabase
          .from('game_teams')
          .update({ team_type: 'machine' })
          .eq('id', team.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar ${team.name}:`, updateError);
        } else {
          console.log(`✅ ${team.name} marcado como máquina`);
        }
      }
    }
    
    // Atualizar times de usuário
    for (const team of userTeams) {
      if (team.team_type !== 'user') {
        const { error: updateError } = await supabase
          .from('game_teams')
          .update({ team_type: 'user' })
          .eq('id', team.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar ${team.name}:`, updateError);
        } else {
          console.log(`✅ ${team.name} marcado como usuário`);
        }
      }
    }
    
    // 5. Verificar resultado final
    console.log('\n📋 Verificando resultado final...');
    
    const { data: finalTeams, error: finalError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .order('team_type, name');
    
    if (finalError) {
      console.error('❌ Erro ao verificar times finais:', finalError);
    } else {
      const finalUserTeams = finalTeams.filter(t => t.team_type === 'user');
      const finalMachineTeams = finalTeams.filter(t => t.team_type === 'machine');
      
      console.log(`✅ Resultado final:`);
      console.log(`  - Times de usuário: ${finalUserTeams.length}`);
      console.log(`  - Times da máquina: ${finalMachineTeams.length}`);
      
      console.log('\n👤 Times de usuário:');
      finalUserTeams.forEach(team => {
        console.log(`  - ${team.name}`);
      });
      
      console.log('\n🤖 Times da máquina:');
      finalMachineTeams.forEach(team => {
        console.log(`  - ${team.name}`);
      });
    }
    
    console.log('\n🎉 Correção de tipos de times concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute: node scripts/test-final-system.js');
    console.log('2. Teste as funcionalidades no frontend');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

// Executar correção
fixTeamTypes(); 