const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function createMinimalPlayers() {
  console.log('⚽ CRIANDO JOGADORES MÍNIMOS PARA TIMES DA MÁQUINA');
  console.log('====================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar times da máquina sem jogadores
    console.log('📋 1. Verificando times da máquina...');
    
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('team_type', 'machine')
      .limit(10); // Apenas 10 times para teste

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    console.log(`📊 Times encontrados: ${machineTeams?.length || 0}`);

    // 2. Verificar jogadores existentes por time
    console.log('\n🔍 2. Verificando jogadores existentes...');
    
    const { data: existingPlayers, error: playersError } = await supabase
      .from('game_players')
      .select('team_id, COUNT(*)', { count: 'exact', head: true })
      .group('team_id');

    if (playersError) {
      console.log('❌ Erro ao verificar jogadores:', playersError.message);
      return;
    }

    const playersPerTeam = {};
    existingPlayers?.forEach(item => {
      playersPerTeam[item.team_id] = parseInt(item.count);
    });

    // 3. Criar jogadores para times que precisam
    console.log('\n🏃 3. Criando jogadores...');
    
    let totalCreated = 0;
    let totalErrors = 0;

    for (const team of machineTeams) {
      const currentPlayers = playersPerTeam[team.id] || 0;
      const neededPlayers = 11 - currentPlayers; // 11 jogadores por time

      if (neededPlayers <= 0) {
        console.log(`   ✅ ${team.name}: Já tem ${currentPlayers} jogadores`);
        continue;
      }

      console.log(`   🏟️ ${team.name}: Criando ${neededPlayers} jogadores...`);

      // Criar 11 jogadores por time (formação básica)
      const positions = ['GK', 'CB', 'CB', 'LB', 'RB', 'DM', 'CM', 'CM', 'AM', 'ST', 'ST'];

      for (let i = 0; i < neededPlayers; i++) {
        const position = positions[i];
        const playerData = {
          id: require('crypto').randomUUID(),
          team_id: team.id,
          name: `Jogador ${i + 1} ${team.name}`,
          age: 25,
          nationality: 'BRA',
          position: position,
          alternative_positions: [],
          team_type: 'machine',
          
          // Atributos básicos
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
          
          // Potencial (respeitando constraint)
          potential: 65,
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

    // 4. Resumo final
    console.log('\n🎉 CRIAÇÃO DE JOGADORES CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ✅ ${totalCreated} jogadores criados`);
    console.log(`   • ❌ ${totalErrors} erros`);
    console.log(`   • 🏟️ ${machineTeams?.length || 0} times processados`);

    // 5. Verificar resultado
    console.log('\n📊 5. Verificando resultado...');
    
    const { data: finalPlayers, error: finalError } = await supabase
      .from('game_players')
      .select('team_id, COUNT(*)', { count: 'exact', head: true })
      .group('team_id');

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log('\n🏟️ JOGADORES POR TIME:');
      machineTeams?.forEach(team => {
        const playerCount = finalPlayers?.find(p => p.team_id === team.id)?.count || 0;
        console.log(`   • ${team.name}: ${playerCount} jogadores`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createMinimalPlayers();
