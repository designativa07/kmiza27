const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function fixDuplicateTeams() {
  console.log('🔧 CORRIGINDO TIMES DUPLICADOS - MANTENDO 20 TIMES');
  console.log('====================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar situação atual
    console.log('📋 1. Verificando situação atual...');
    
    const { data: allTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, created_at')
      .eq('team_type', 'machine')
      .order('created_at');

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    console.log(`📊 Times da máquina encontrados: ${allTeams?.length || 0}`);

    // 2. Identificar duplicatas
    console.log('\n🔍 2. Identificando duplicatas...');
    
    const teamNames = {};
    const teamsToKeep = [];
    const teamsToDelete = [];

    allTeams?.forEach(team => {
      if (!teamNames[team.name]) {
        teamNames[team.name] = true;
        teamsToKeep.push(team);
      } else {
        teamsToDelete.push(team);
      }
    });

    console.log(`   ✅ Times únicos: ${teamsToKeep.length}`);
    console.log(`   🗑️  Times duplicados: ${teamsToDelete.length}`);

    // 3. Manter apenas os primeiros 20 times únicos
    console.log('\n🎯 3. Selecionando 20 times para o campeonato...');
    
    const selectedTeams = teamsToKeep.slice(0, 20);
    const remainingTeams = teamsToKeep.slice(20);
    
    console.log(`   🏆 Times selecionados: ${selectedTeams.length}`);
    console.log(`   📋 Times restantes: ${remainingTeams.length}`);

    // 4. Deletar times não selecionados
    console.log('\n🗑️  4. Removendo times não selecionados...');
    
    const allTeamsToDelete = [...teamsToDelete, ...remainingTeams];
    
    if (allTeamsToDelete.length > 0) {
      const teamIdsToDelete = allTeamsToDelete.map(t => t.id);
      
      // Primeiro deletar jogadores desses times
      const { error: playersError } = await supabase
        .from('game_players')
        .delete()
        .in('team_id', teamIdsToDelete);

      if (playersError) {
        console.log('   ❌ Erro ao deletar jogadores:', playersError.message);
      } else {
        console.log(`   ✅ Jogadores dos times removidos deletados`);
      }

      // Depois deletar os times
      const { error: deleteError } = await supabase
        .from('game_teams')
        .delete()
        .in('id', teamIdsToDelete);

      if (deleteError) {
        console.log('   ❌ Erro ao deletar times:', deleteError.message);
      } else {
        console.log(`   ✅ ${allTeamsToDelete.length} times removidos`);
      }
    }

    // 5. Verificar resultado final
    console.log('\n📊 5. Verificando resultado final...');
    
    const { data: finalTeams, error: finalError } = await supabase
      .from('game_teams')
      .select('name, team_type')
      .eq('team_type', 'machine')
      .order('name');

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`📊 Times finais: ${finalTeams?.length || 0}`);
      console.log('\n🏟️  TIMES SELECIONADOS PARA O CAMPEONATO:');
      console.log('===========================================');
      finalTeams?.forEach((team, index) => {
        console.log(`   ${index + 1}. ${team.name}`);
      });
    }

    // 6. Verificar jogadores restantes
    const { count: finalPlayers } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    console.log(`\n⚽ Jogadores restantes: ${finalPlayers || 0}`);
    console.log(`📈 Jogadores por time: ${finalPlayers ? Math.floor(finalPlayers / (finalTeams?.length || 1)) : 0}`);

    // 7. Resumo final
    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ✅ ${finalTeams?.length || 0} times únicos mantidos`);
    console.log(`   • ✅ ${finalPlayers || 0} jogadores restantes`);
    console.log(`   • ✅ Sistema otimizado para campeonato`);
    console.log(`   • ✅ Pronto para simulação de partidas`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixDuplicateTeams();
