const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function fixAutoPlayerCreation() {
  console.log('🔧 CORRIGINDO SISTEMA DE CRIAÇÃO AUTOMÁTICA DE JOGADORES');
  console.log('==========================================================\n');

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

    // 2. Criar jogadores para times que precisam
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

      // Criar 11 jogadores por time (formação básica)
      const positions = ['GK', 'CB', 'CB', 'LB', 'RB', 'DM', 'CM', 'CM', 'AM', 'ST', 'ST'];

      for (let i = 0; i < neededPlayers; i++) {
        const position = positions[i];
        
        // Usar valores de potential que respeitem a constraint (baseado nos existentes: 42-81)
        const potential = Math.floor(Math.random() * 20) + 50; // 50-69 (seguro)
        
        const playerData = {
          id: require('crypto').randomUUID(),
          team_id: team.id,
          name: `Jogador ${i + 1} ${team.name}`,
          age: 25,
          nationality: 'BRA',
          position: position,
          alternative_positions: [],
          team_type: team.team_type,
          
          // Atributos básicos (valores seguros)
          passing: 60,
          shooting: 55,
          dribbling: 55,
          crossing: 55,
          finishing: position === 'ST' ? 65 : 50,
          speed: 60,
          stamina: 65,
          strength: 60,
          jumping: 60,
          concentration: 60,
          creativity: 55,
          vision: 60,
          leadership: 40,
          defending: position.includes('B') || position === 'DM' ? 65 : 45,
          tackling: position.includes('B') || position === 'DM' ? 65 : 45,
          heading: position.includes('B') || position === 'ST' ? 65 : 50,
          goalkeeping: position === 'GK' ? 75 : 15,
          
          // Potencial (respeitando constraint - valores seguros)
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
    console.log('   • O campo potential deve estar entre 50-69 para evitar overflow');
    console.log('   • Valores seguros: 50, 55, 60, 65');
    console.log('   • Evitar valores muito altos (>80) ou muito baixos (<40)');
    console.log('   • O sistema automático deve usar estes ranges seguros');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixAutoPlayerCreation();
