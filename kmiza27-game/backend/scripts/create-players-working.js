const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function createPlayersWorking() {
  console.log('🏆 CRIANDO JOGADORES - USANDO APENAS CAMPOS QUE FUNCIONAM');
  console.log('================================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar times sem jogadores
    console.log('📋 1. Verificando times sem jogadores...');
    
    const { data: allTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type');

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    const { data: allPlayers, error: playersError } = await supabase
      .from('game_players')
      .select('team_id');

    if (playersError) {
      console.log('❌ Erro ao buscar jogadores:', playersError.message);
      return;
    }

    // Contar jogadores por time
    const playersPerTeam = {};
    allPlayers?.forEach(player => {
      playersPerTeam[player.team_id] = (playersPerTeam[player.team_id] || 0) + 1;
    });

    // Identificar times sem jogadores
    const teamsWithoutPlayers = allTeams?.filter(team => !playersPerTeam[team.id] || playersPerTeam[team.id] < 11) || [];
    
    console.log(`📊 Times sem jogadores suficientes: ${teamsWithoutPlayers.length}`);
    teamsWithoutPlayers.forEach(team => {
      const playerCount = playersPerTeam[team.id] || 0;
      console.log(`   • ${team.name} (${team.team_type}): ${playerCount} jogadores`);
    });

    // 2. Criar jogadores usando APENAS os campos que funcionaram
    console.log('\n🏃 2. Criando jogadores...');
    
    let totalCreated = 0;
    let totalErrors = 0;

    for (const team of teamsWithoutPlayers) {
      const currentPlayers = playersPerTeam[team.id] || 0;
      const neededPlayers = 11 - currentPlayers;

      if (neededPlayers <= 0) {
        console.log(`   ✅ ${team.name}: Já tem ${currentPlayers} jogadores`);
        continue;
      }

      console.log(`   🏟️ ${team.name}: Criando ${neededPlayers} jogadores...`);

      // Formação básica com posições que respeitam constraints
      const positions = [
        { pos: 'GK', isGK: true },
        { pos: 'CB', isGK: false },
        { pos: 'CB', isGK: false },
        { pos: 'LB', isGK: false },
        { pos: 'RB', isGK: false },
        { pos: 'DM', isGK: false },
        { pos: 'CM', isGK: false },
        { pos: 'CM', isGK: false },
        { pos: 'AM', isGK: false },
        { pos: 'ST', isGK: false },
        { pos: 'ST', isGK: false }
      ];

      for (let i = 0; i < neededPlayers; i++) {
        const position = positions[i];
        
        // Valores que respeitam TODAS as constraints conhecidas
        const age = Math.floor(Math.random() * 8) + 22; // 22-29 anos (seguro para constraint de idade)
        
        // IMPORTANTE: Usar APENAS os campos que funcionaram no teste
        const playerData = {
          id: require('crypto').randomUUID(),
          team_id: team.id,
          name: `Jogador ${i + 1} ${team.name}`,
          age: age,
          nationality: 'BRA',
          position: position.pos,
          goalkeeping: position.isGK ? 80 : 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          const { error: insertError } = await supabase
            .from('game_players')
            .insert(playerData);

          if (insertError) {
            console.log(`      ❌ Erro ao criar jogador: ${insertError.message}`);
            totalErrors++;
          } else {
            totalCreated++;
          }
        } catch (error) {
          console.log(`      ❌ Erro geral: ${error.message}`);
          totalErrors++;
        }
      }
    }

    // 3. Resumo final
    console.log('\n🎉 CRIAÇÃO DE JOGADORES CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ✅ ${totalCreated} jogadores criados`);
    console.log(`   • ❌ ${totalErrors} erros`);
    console.log(`   • 🏟️ ${teamsWithoutPlayers.length} times processados`);

    // 4. Verificar resultado
    console.log('\n📊 4. Verificando resultado...');
    
    const { data: finalPlayers, error: finalError } = await supabase
      .from('game_players')
      .select('team_id');

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      // Contar manualmente
      const finalPlayersPerTeam = {};
      finalPlayers?.forEach(player => {
        finalPlayersPerTeam[player.team_id] = (finalPlayersPerTeam[player.team_id] || 0) + 1;
      });

      console.log('\n🏟️ JOGADORES POR TIME:');
      allTeams?.forEach(team => {
        const playerCount = finalPlayersPerTeam[team.id] || 0;
        console.log(`   • ${team.name} (${team.team_type}): ${playerCount} jogadores`);
      });
    }

    // 5. Recomendações para o sistema
    console.log('\n💡 RECOMENDAÇÕES PARA O SISTEMA:');
    console.log('   • Usar APENAS os campos que funcionaram: id, team_id, name, age, nationality, position, goalkeeping, created_at, updated_at');
    console.log('   • Respeitar constraint de idade: age deve estar em range válido (22-29)');
    console.log('   • Respeitar constraint valid_goalkeeper: GK deve ter goalkeeping > 70');
    console.log('   • O erro "numeric field overflow" era um diagnóstico incorreto');
    console.log('   • Outros campos podem ser adicionados gradualmente após identificar constraints');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createPlayersWorking();
