const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function cleanupMachineTeamsYouth() {
  console.log('🤖 LIMPEZA DE JOGADORES DA BASE DOS TIMES DA MÁQUINA');
  console.log('====================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar situação atual
    console.log('📊 1. Verificando situação atual...');
    
    // Buscar times da máquina
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .eq('team_type', 'machine');

    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }

    console.log(`📋 Times da máquina encontrados: ${machineTeams?.length || 0}`);
    machineTeams?.forEach(team => {
      console.log(`   • ${team.name} (${team.id})`);
    });

    // 2. Verificar jogadores da base dos times da máquina
    console.log('\n👶 2. Verificando jogadores da base dos times da máquina...');
    
    const machineTeamIds = machineTeams?.map(t => t.id) || [];
    
    if (machineTeamIds.length === 0) {
      console.log('✅ Nenhum time da máquina encontrado!');
      return;
    }

    const { data: machineYouthPlayers, error: youthError } = await supabase
      .from('youth_players')
      .select('id, name, position, team_id')
      .in('team_id', machineTeamIds);

    if (youthError) {
      console.log('❌ Erro ao buscar jogadores da base:', youthError.message);
      return;
    }

    console.log(`📊 Jogadores da base em times da máquina: ${machineYouthPlayers?.length || 0}`);

    if (machineYouthPlayers && machineYouthPlayers.length > 0) {
      console.log('\n🔍 Detalhes dos jogadores da base:');
      machineYouthPlayers.forEach((player, index) => {
        const team = machineTeams?.find(t => t.id === player.team_id);
        console.log(`  ${index + 1}. ${player.name} (${player.position}) - ${team?.name || 'Time não encontrado'}`);
      });
    }

    // 3. Verificar jogadores profissionais dos times da máquina
    console.log('\n👨‍💼 3. Verificando jogadores profissionais dos times da máquina...');
    
    const { data: machineProPlayers, error: proError } = await supabase
      .from('game_players')
      .select('id, name, position, team_id')
      .in('team_id', machineTeamIds);

    if (proError) {
      console.log('❌ Erro ao buscar jogadores profissionais:', proError.message);
      return;
    }

    console.log(`📊 Jogadores profissionais em times da máquina: ${machineProPlayers?.length || 0}`);

    if (machineProPlayers && machineProPlayers.length > 0) {
      console.log('\n🔍 Detalhes dos jogadores profissionais:');
      machineProPlayers.forEach((player, index) => {
        const team = machineTeams?.find(t => t.id === player.team_id);
        console.log(`  ${index + 1}. ${player.name} (${player.position}) - ${team?.name || 'Time não encontrado'}`);
      });
    }

    // 4. Estratégia de limpeza
    console.log('\n🎯 4. Estratégia de limpeza...');
    console.log('💡 Remover TODOS os jogadores da base dos times da máquina');
    console.log('💡 Manter apenas jogadores profissionais (titulares para simulação)');
    console.log('💡 Jogadores da base só devem existir em times reais criados por usuários');

    // 5. Remover jogadores da base dos times da máquina
    console.log('\n🗑️ 5. Removendo jogadores da base dos times da máquina...');
    
    if (machineYouthPlayers && machineYouthPlayers.length > 0) {
      const youthPlayerIds = machineYouthPlayers.map(p => p.id);
      
      const { error: deleteYouthError } = await supabase
        .from('youth_players')
        .delete()
        .in('id', youthPlayerIds);

      if (deleteYouthError) {
        console.log('❌ Erro ao remover jogadores da base:', deleteYouthError.message);
      } else {
        console.log(`✅ ${machineYouthPlayers.length} jogadores da base removidos dos times da máquina`);
      }
    } else {
      console.log('✅ Nenhum jogador da base para remover');
    }

    // 6. Verificar resultado final
    console.log('\n📊 6. Verificando resultado final...');
    
    // Verificar jogadores da base restantes
    const { count: finalYouthCount } = await supabase
      .from('youth_players')
      .select('*', { count: 'exact', head: true });

    // Verificar jogadores profissionais restantes
    const { count: finalProCount } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total final de jogadores da base: ${finalYouthCount || 0}`);
    console.log(`📊 Total final de jogadores profissionais: ${finalProCount || 0}`);
    console.log(`📊 Total geral: ${(finalYouthCount || 0) + (finalProCount || 0)}`);

    // 7. Verificar distribuição por tipo de time
    console.log('\n🏟️ 7. Verificando distribuição por tipo de time...');
    
    // Jogadores da base restantes (devem estar apenas em times reais)
    const { data: remainingYouth, error: remainingYouthError } = await supabase
      .from('youth_players')
      .select(`
        id,
        name,
        position,
        team:game_teams!youth_players_team_id_fkey(
          id,
          name,
          team_type
        )
      `);

    if (remainingYouthError) {
      console.log('❌ Erro ao verificar jogadores da base restantes:', remainingYouthError.message);
    } else {
      console.log(`📊 Jogadores da base restantes: ${remainingYouth?.length || 0}`);
      
      if (remainingYouth && remainingYouth.length > 0) {
        console.log('\n🔍 Detalhes dos jogadores da base restantes:');
        remainingYouth.forEach((player, index) => {
          const teamType = player.team?.team_type || 'N/A';
          const teamName = player.team?.name || 'Time não encontrado';
          console.log(`  ${index + 1}. ${player.name} (${player.position}) - ${teamName} (${teamType})`);
        });
      }
    }

    // 8. Estatísticas finais
    console.log('\n📈 8. Estatísticas finais...');
    
    const removedYouthCount = machineYouthPlayers?.length || 0;
    const remainingProCount = machineProPlayers?.length || 0;
    
    console.log(`🗑️ Jogadores da base removidos: ${removedYouthCount}`);
    console.log(`👨‍💼 Jogadores profissionais mantidos: ${remainingProCount}`);
    console.log(`📊 Total de jogadores nos times da máquina: ${remainingProCount}`);

    console.log('\n🎉 LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ${removedYouthCount} jogadores da base removidos dos times da máquina`);
    console.log(`   • ${remainingProCount} jogadores profissionais mantidos (titulares para simulação)`);
    console.log(`   • Jogadores da base agora só existem em times reais criados por usuários`);
    console.log(`   • Sistema otimizado para simulação de partidas`);

    console.log('\n💡 COMO FUNCIONA AGORA:');
    console.log('   1. ✅ Times da máquina: Apenas jogadores profissionais (titulares)');
    console.log('   2. ✅ Times reais: Jogadores profissionais + jogadores da base');
    console.log('   3. ✅ Simulação de partidas: Usa apenas jogadores profissionais');
    console.log('   4. ✅ Academia de base: Disponível apenas para times reais');

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Testar simulação de partidas com times da máquina');
    console.log('   2. Verificar se sistema está mais eficiente');
    console.log('   3. Testar criação de times reais com jogadores da base');

    // 9. Verificar se há times reais com jogadores da base
    console.log('\n👥 9. Verificando times reais com jogadores da base...');
    
    const { data: realTeams, error: realTeamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .eq('team_type', 'user_created');

    if (realTeamsError) {
      console.log('❌ Erro ao buscar times reais:', realTeamsError.message);
    } else {
      console.log(`📊 Times reais criados por usuários: ${realTeams?.length || 0}`);
      
      if (realTeams && realTeams.length > 0) {
        console.log('📋 Times reais:');
        realTeams.forEach(team => {
          console.log(`   • ${team.name} (${team.id})`);
        });
        
        console.log('\n💡 Estes times podem ter jogadores da base para desenvolvimento da academia');
      } else {
        console.log('💡 Nenhum time real criado ainda - jogadores da base serão criados quando necessário');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

cleanupMachineTeamsYouth();
