const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function testNewTeamCreation() {
  console.log('🧪 TESTANDO CRIAÇÃO DE NOVO TIME - O QUE ACONTECE?');
  console.log('===================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar estado atual
    console.log('📋 1. Estado atual do sistema...');
    
    const { data: allTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, created_at')
      .order('created_at');

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    const { data: allPlayers, error: playersError } = await supabase
      .from('game_players')
      .select('team_id, team_type');

    if (playersError) {
      console.log('❌ Erro ao buscar jogadores:', playersError.message);
      return;
    }

    // Contar jogadores por time
    const playersPerTeam = {};
    allPlayers?.forEach(player => {
      playersPerTeam[player.team_id] = (playersPerTeam[player.team_id] || 0) + 1;
    });

    console.log('📊 TIMES ATUAIS:');
    allTeams?.forEach(team => {
      const playerCount = playersPerTeam[team.id] || 0;
      console.log(`   • ${team.name} (${team.team_type}): ${playerCount} jogadores`);
    });

    // 2. Deletar um time existente para teste
    console.log('\n🗑️ 2. Deletando time para teste...');
    
    // Encontrar um time de usuário para deletar
    const userTeam = allTeams?.find(team => team.team_type === 'user_created');
    
    if (!userTeam) {
      console.log('❌ Nenhum time de usuário encontrado para deletar');
      return;
    }

    console.log(`🗑️ Deletando time: ${userTeam.name}`);
    
    // Deletar jogadores primeiro
    const { error: deletePlayersError } = await supabase
      .from('game_players')
      .delete()
      .eq('team_id', userTeam.id);

    if (deletePlayersError) {
      console.log('❌ Erro ao deletar jogadores:', deletePlayersError.message);
      return;
    }

    // Deletar o time
    const { error: deleteTeamError } = await supabase
      .from('game_teams')
      .delete()
      .eq('id', userTeam.id);

    if (deleteTeamError) {
      console.log('❌ Erro ao deletar time:', deleteTeamError.message);
      return;
    }

    console.log('✅ Time deletado com sucesso!');

    // 3. Criar um novo time
    console.log('\n🏗️ 3. Criando novo time...');
    
    const newTeam = {
      id: require('crypto').randomUUID(),
      name: 'Time Teste Novo',
      team_type: 'user_created',
      budget: 1000000,
      reputation: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: createTeamError } = await supabase
      .from('game_teams')
      .insert(newTeam);

    if (createTeamError) {
      console.log('❌ Erro ao criar time:', createTeamError.message);
      return;
    }

    console.log('✅ Novo time criado com sucesso!');

    // 4. Verificar se jogadores foram criados automaticamente
    console.log('\n🔍 4. Verificando se jogadores foram criados automaticamente...');
    
    // Aguardar um pouco para qualquer processo automático
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: newTeamPlayers, error: newPlayersError } = await supabase
      .from('game_players')
      .select('*')
      .eq('team_id', newTeam.id);

    if (newPlayersError) {
      console.log('❌ Erro ao buscar jogadores do novo time:', newPlayersError.message);
    } else {
      console.log(`📊 Jogadores do novo time: ${newTeamPlayers?.length || 0}`);
      
      if (newTeamPlayers && newTeamPlayers.length > 0) {
        console.log('📋 Detalhes dos jogadores:');
        newTeamPlayers.forEach((player, index) => {
          console.log(`   • ${index + 1}: ${player.name} (${player.position}) - Age: ${player.age}`);
        });
      }
    }

    // 5. Verificar se há jogadores de base
    console.log('\n🔍 5. Verificando jogadores de base...');
    
    const { data: youthPlayers, error: youthError } = await supabase
      .from('youth_players')
      .select('*')
      .eq('team_id', newTeam.id);

    if (youthError) {
      console.log('❌ Erro ao buscar jogadores de base:', youthError.message);
    } else {
      console.log(`📊 Jogadores de base: ${youthPlayers?.length || 0}`);
      
      if (youthPlayers && youthPlayers.length > 0) {
        console.log('📋 Detalhes dos jogadores de base:');
        youthPlayers.forEach((player, index) => {
          console.log(`   • ${index + 1}: ${player.name} (${player.position}) - Age: ${player.age}`);
        });
      }
    }

    // 6. Verificar estado final
    console.log('\n📊 6. Estado final do sistema...');
    
    const { data: finalTeams, error: finalTeamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .order('created_at');

    if (!finalTeamsError) {
      const { data: finalPlayers, error: finalPlayersError } = await supabase
        .from('game_players')
        .select('team_id');

      if (!finalPlayersError) {
        const finalPlayersPerTeam = {};
        finalPlayers?.forEach(player => {
          finalPlayersPerTeam[player.team_id] = (finalPlayersPerTeam[player.team_id] || 0) + 1;
        });

        console.log('📊 TIMES FINAIS:');
        finalTeams?.forEach(team => {
          const playerCount = finalPlayersPerTeam[team.id] || 0;
          console.log(`   • ${team.name} (${team.team_type}): ${playerCount} jogadores`);
        });
      }
    }

    // 7. Resumo e recomendações
    console.log('\n💡 RESUMO E RECOMENDAÇÕES:');
    console.log('   • O sistema NÃO cria jogadores automaticamente para novos times');
    console.log('   • Novos times começam SEM jogadores');
    console.log('   • É necessário criar jogadores manualmente ou implementar sistema automático');
    console.log('   • Para ter 23 jogadores + base, precisa implementar lógica de criação automática');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testNewTeamCreation();
