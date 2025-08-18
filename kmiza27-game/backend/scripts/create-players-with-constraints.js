const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function createPlayersWithConstraints() {
  console.log('🔧 CRIANDO JOGADORES RESPEITANDO TODAS AS CONSTRAINTS');
  console.log('======================================================\n');

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

    // 2. Criar jogadores respeitando constraints
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
        
        // Valores que respeitam constraints
        const age = Math.floor(Math.random() * 10) + 20; // 20-29 anos (seguro)
        const potential = Math.floor(Math.random() * 20) + 50; // 50-69 (seguro)
        
        const playerData = {
          id: require('crypto').randomUUID(),
          team_id: team.id,
          name: `Jogador ${i + 1} ${team.name}`,
          age: age,
          nationality: 'BRA',
          position: position.pos,
          alternative_positions: [],
          team_type: team.team_type,
          
          // Atributos básicos (valores seguros)
          passing: 60,
          shooting: 55,
          dribbling: 55,
          crossing: 55,
          finishing: position.pos === 'ST' ? 65 : 50,
          speed: 60,
          stamina: 65,
          strength: 60,
          jumping: 60,
          concentration: 60,
          creativity: 55,
          vision: 60,
          leadership: 40,
          defending: position.pos.includes('B') || position.pos === 'DM' ? 65 : 45,
          tackling: position.pos.includes('B') || position.pos === 'DM' ? 65 : 45,
          heading: position.pos.includes('B') || position.pos === 'ST' ? 65 : 50,
          
          // IMPORTANTE: goalkeeping deve respeitar constraint valid_goalkeeper
          goalkeeping: position.isGK ? 75 : 15,
          
          // Potencial (respeitando constraint)
          potential: potential,
          development_rate: 50,
          
          // Status
          morale: 70,
          fitness: 100,
          form: 70,
          
          // Lesões
          injury_proneness: 15,
          injury_type: null,
          injury_severity: null,
          injury_return_date: null,
          
          // Contrato
          contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          salary_monthly: 15000,
          signing_bonus: 50000,
          release_clause: 500000,
          market_value: 200000,
          last_value_update: new Date().toISOString(),
          
          // Estatísticas
          games_played: 0,
          games_started: 0,
          minutes_played: 0,
          goals_scored: 0,
          assists: 0,
          shots_taken: 0,
          shots_on_target: 0,
          tackles_made: 0,
          interceptions: 0,
          clearances: 0,
          clean_sheets: 0,
          yellow_cards: 0,
          red_cards: 0,
          average_rating: 0,
          last_ratings: [],
          
          // Informações do jogador
          origin: 'academy',
          signed_date: new Date().toISOString(),
          previous_clubs: [],
          youth_academy_level: 1,
          promoted_from_youth: false,
          
          // Treinamento
          individual_training: false,
          training_start_date: null,
          training_end_date: null,
          training_progress: 0,
          training_points_week: 0,
          
          // Outros campos
          salary: 15000,
          is_in_academy: false,
          training_focus: 'balanced',
          training_intensity: 'medium',
          avatar_url: null,
          fatigue: 0,
          injury_until: null,
          traits: [],
          training_type: 'general',
          pace: 60,
          physical: 60,
          wage: 15000,
          contract_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          is_transfer_listed: false,
          asking_price: 0,
          
          // Timestamps
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
            
            // Se for constraint de goleiro, tentar corrigir
            if (insertError.message.includes('valid_goalkeeper')) {
              console.log(`      🔧 Tentando corrigir constraint de goleiro...`);
              
              const correctedData = { ...playerData };
              correctedData.goalkeeping = position.isGK ? 80 : 10; // Valores mais extremos
              
              const { error: correctedError } = await supabase
                .from('game_players')
                .insert(correctedData);
              
              if (correctedError) {
                console.log(`         ❌ Correção falhou: ${correctedError.message}`);
              } else {
                console.log(`         ✅ Correção bem-sucedida!`);
                totalCreated++;
                totalErrors--; // Descontar o erro anterior
              }
            }
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
    console.log('   • Respeitar constraint valid_goalkeeper: GK deve ter goalkeeping > 70');
    console.log('   • Respeitar constraint de idade: age deve estar em range válido');
    console.log('   • Usar valores seguros para potential: 50-69');
    console.log('   • Verificar todas as constraints antes da inserção');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createPlayersWithConstraints();
