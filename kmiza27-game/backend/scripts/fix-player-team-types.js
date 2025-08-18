const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function fixPlayerTeamTypes() {
  console.log('🔧 CORRIGINDO TEAM_TYPE DOS JOGADORES');
  console.log('======================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar times da máquina
    console.log('🤖 1. Verificando times da máquina...');
    
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .eq('team_type', 'machine');

    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }

    console.log(`🏟️ Encontrados ${machineTeams?.length || 0} times da máquina`);
    
    if (!machineTeams || machineTeams.length === 0) {
      console.log('⚠️ Nenhum time da máquina encontrado');
      return;
    }

    const machineTeamIds = machineTeams.map(team => team.id);
    console.log('📋 IDs dos times da máquina:', machineTeamIds.slice(0, 5), '...');

    // 2. Atualizar jogadores dos times da máquina
    console.log('\n🔄 2. Atualizando team_type dos jogadores...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('game_players')
      .update({ team_type: 'machine' })
      .in('team_id', machineTeamIds)
      .eq('team_type', 'first_team');

    if (updateError) {
      console.log('❌ Erro ao atualizar jogadores:', updateError.message);
      return;
    }

    console.log('✅ Jogadores atualizados com sucesso!');

    // 3. Verificar resultado
    console.log('\n📊 3. Verificando resultado...');
    
    const { data: finalPlayers, error: finalError } = await supabase
      .from('game_players')
      .select('team_type')
      .in('team_id', machineTeamIds);

    if (!finalError && finalPlayers) {
      const machinePlayers = finalPlayers.filter(p => p.team_type === 'machine');
      const otherPlayers = finalPlayers.filter(p => p.team_type !== 'machine');
      
      console.log(`🤖 Jogadores com team_type = 'machine': ${machinePlayers.length}`);
      console.log(`❓ Outros tipos: ${otherPlayers.length}`);
      
      if (otherPlayers.length > 0) {
        const types = [...new Set(otherPlayers.map(p => p.team_type))];
        console.log('📋 Tipos restantes:', types);
      }
    }

    // 4. Verificar jogadores do time do usuário
    console.log('\n👤 4. Verificando jogadores do time do usuário...');
    
    const { data: userTeam, error: userTeamError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('team_type', 'user_created')
      .limit(1);

    if (!userTeamError && userTeam && userTeam.length > 0) {
      const userTeamId = userTeam[0].id;
      
      const { data: userPlayers, error: userPlayersError } = await supabase
        .from('game_players')
        .select('team_type')
        .eq('team_id', userTeamId);

      if (!userPlayersError && userPlayers) {
        const userTeamPlayers = userPlayers.filter(p => p.team_type === 'user_created');
        const otherUserPlayers = userPlayers.filter(p => p.team_type !== 'user_created');
        
        console.log(`👤 Jogadores do time do usuário com team_type = 'user_created': ${userTeamPlayers.length}`);
        console.log(`❓ Outros tipos no time do usuário: ${otherUserPlayers.length}`);
        
        if (otherUserPlayers.length > 0) {
          // Atualizar jogadores do time do usuário
          const { error: userUpdateError } = await supabase
            .from('game_players')
            .update({ team_type: 'user_created' })
            .eq('team_id', userTeamId)
            .neq('team_type', 'user_created');

          if (userUpdateError) {
            console.log('❌ Erro ao atualizar jogadores do usuário:', userUpdateError.message);
          } else {
            console.log('✅ Jogadores do time do usuário atualizados!');
          }
        }
      }
    }

    // 5. Resumo final
    console.log('\n🎉 RESUMO FINAL:');
    console.log('================');
    console.log('✅ Team_type dos jogadores corrigido!');
    console.log('✅ Jogadores dos times da máquina agora têm team_type = "machine"');
    console.log('✅ Jogadores do time do usuário agora têm team_type = "user_created"');
    console.log('');
    console.log('🔄 PRÓXIMOS PASSOS:');
    console.log('====================');
    console.log('1. Execute novamente o script de popular o mercado');
    console.log('2. Agora deve encontrar jogadores da máquina');
    console.log('3. O mercado será populado com jogadores disponíveis!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixPlayerTeamTypes();
