const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function createSimplePlayers() {
  console.log('⚽ CRIANDO JOGADORES SIMPLES PARA TIMES DA MÁQUINA');
  console.log('==================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar times da máquina
    console.log('📋 1. Verificando times da máquina...');
    
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('team_type', 'machine')
      .limit(5); // Apenas 5 times para teste

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    console.log(`📊 Times encontrados: ${machineTeams?.length || 0}`);

    // 2. Criar jogadores simples
    console.log('\n🏃 2. Criando jogadores...');
    
    let totalCreated = 0;
    let totalErrors = 0;

    for (const team of machineTeams) {
      console.log(`   🏟️ ${team.name}: Criando 11 jogadores...`);

      // Criar 11 jogadores por time (formação básica)
      const players = [
        { pos: 'GK', name: 'Goleiro' },
        { pos: 'CB', name: 'Zagueiro 1' },
        { pos: 'CB', name: 'Zagueiro 2' },
        { pos: 'LB', name: 'Lateral Esquerdo' },
        { pos: 'RB', name: 'Lateral Direito' },
        { pos: 'DM', name: 'Volante' },
        { pos: 'CM', name: 'Meio Campo 1' },
        { pos: 'CM', name: 'Meio Campo 2' },
        { pos: 'AM', name: 'Meia Atacante' },
        { pos: 'ST', name: 'Atacante 1' },
        { pos: 'ST', name: 'Atacante 2' }
      ];

      for (const player of players) {
        const playerData = {
          id: require('crypto').randomUUID(),
          team_id: team.id,
          name: `${player.name} ${team.name}`,
          position: player.pos,
          nationality: 'BRA',
          age: 25,
          height: 180,
          weight: 75,
          
          // Atributos básicos
          goalkeeping: player.pos === 'GK' ? 75 : 15,
          defending: player.pos.includes('B') || player.pos === 'DM' ? 65 : 45,
          passing: 60,
          dribbling: 55,
          shooting: player.pos === 'ST' ? 70 : 50,
          
          // Atributos físicos
          speed: 60,
          stamina: 65,
          strength: 60,
          jumping: 60,
          
          // Atributos mentais
          concentration: 60,
          creativity: 55,
          vision: 60,
          leadership: 40,
          
          // Atributos técnicos
          tackling: player.pos.includes('B') || player.pos === 'DM' ? 65 : 45,
          heading: player.pos.includes('B') || player.pos === 'ST' ? 65 : 50,
          crossing: player.pos.includes('B') ? 60 : 50,
          finishing: player.pos === 'ST' ? 70 : 50,
          
          // Potencial (respeitando constraint)
          potential: 65,
          
          // Informações contratuais
          salary_monthly: 15000,
          contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          signing_bonus: 50000,
          release_clause: 500000,
          
          // Status do jogador
          team_type: 'machine',
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
          
          // Estatísticas
          games_started: 0,
          minutes_played: 0,
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
          
          // Lesões
          injury_proneness: 15,
          injury_type: null,
          injury_severity: null,
          injury_return_date: null,
          
          // Desenvolvimento
          development_rate: 50,
          alternative_positions: [],
          
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
    console.log(`   • 🏟️ ${machineTeams?.length || 0} times processados`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createSimplePlayers();
