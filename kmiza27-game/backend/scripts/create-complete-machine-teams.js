const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function createCompleteMachineTeams() {
  console.log('🤖 CRIANDO JOGADORES COMPLETOS PARA TIMES DA MÁQUINA');
  console.log('=====================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar times da máquina
    console.log('📋 1. Verificando times da máquina...');
    
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, budget')
      .eq('team_type', 'machine')
      .order('budget DESC');

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    console.log(`📊 Times da máquina encontrados: ${machineTeams?.length || 0}`);

    // 2. Verificar jogadores existentes
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

    console.log(`📊 Jogadores existentes por time:`, playersPerTeam);

    // 3. Definir posições e atributos base
    console.log('\n⚽ 3. Definindo estrutura de jogadores...');
    
    const positions = [
      { pos: 'GK', count: 2, goalkeeping: 75, other_skills: 15 },
      { pos: 'CB', count: 4, goalkeeping: 15, other_skills: 65 },
      { pos: 'LB', count: 2, goalkeeping: 15, other_skills: 60 },
      { pos: 'RB', count: 2, goalkeeping: 15, other_skills: 60 },
      { pos: 'DM', count: 2, goalkeeping: 15, other_skills: 65 },
      { pos: 'CM', count: 3, goalkeeping: 15, other_skills: 65 },
      { pos: 'AM', count: 2, goalkeeping: 15, other_skills: 70 },
      { pos: 'LW', count: 2, goalkeeping: 15, other_skills: 65 },
      { pos: 'RW', count: 2, goalkeeping: 15, other_skills: 65 },
      { pos: 'ST', count: 2, goalkeeping: 15, other_skills: 70 }
    ];

    // 4. Criar jogadores para cada time
    console.log('\n🏃 4. Criando jogadores...');
    
    let totalCreated = 0;
    let totalErrors = 0;

    for (const team of machineTeams) {
      const currentPlayers = playersPerTeam[team.id] || 0;
      const neededPlayers = 23 - currentPlayers;

      if (neededPlayers <= 0) {
        console.log(`   ✅ ${team.name}: Já tem ${currentPlayers} jogadores`);
        continue;
      }

      console.log(`   🏟️ ${team.name}: Criando ${neededPlayers} jogadores...`);

      // Determinar nível base baseado no orçamento
      let baseLevel, potentialRange;
      if (team.budget >= 5000000) { // Série A
        baseLevel = 75;
        potentialRange = [70, 85];
      } else if (team.budget >= 2000000) { // Série B
        baseLevel = 65;
        potentialRange = [60, 75];
      } else if (team.budget >= 1000000) { // Série C
        baseLevel = 55;
        potentialRange = [50, 65];
      } else { // Série D
        baseLevel = 45;
        potentialRange = [40, 55];
      }

      // Criar jogadores por posição
      for (const position of positions) {
        for (let i = 0; i < position.count && totalCreated < neededPlayers; i++) {
          const playerData = {
            id: require('crypto').randomUUID(),
            team_id: team.id,
            name: generatePlayerName(position.pos),
            position: position.pos,
            nationality: 'BRA',
            age: Math.floor(Math.random() * 10) + 18, // 18-27 anos
            height: Math.floor(Math.random() * 20) + 170, // 170-189 cm
            weight: Math.floor(Math.random() * 20) + 70, // 70-89 kg
            
            // Atributos principais
            goalkeeping: position.goalkeeping,
            defending: position.pos.includes('B') || position.pos.includes('DM') ? baseLevel + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 30) + 20,
            passing: position.pos.includes('M') || position.pos.includes('B') ? baseLevel + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 30) + 20,
            dribbling: position.pos.includes('M') || position.pos.includes('W') ? baseLevel + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 30) + 20,
            shooting: position.pos.includes('M') || position.pos.includes('W') || position.pos.includes('T') ? baseLevel + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 30) + 20,
            
            // Atributos físicos
            speed: Math.floor(Math.random() * 20) + 50,
            stamina: Math.floor(Math.random() * 20) + 50,
            strength: Math.floor(Math.random() * 20) + 50,
            jumping: Math.floor(Math.random() * 20) + 50,
            
            // Atributos mentais
            concentration: Math.floor(Math.random() * 20) + 50,
            creativity: Math.floor(Math.random() * 20) + 50,
            vision: Math.floor(Math.random() * 20) + 50,
            leadership: Math.floor(Math.random() * 20) + 30,
            
            // Atributos técnicos
            tackling: position.pos.includes('B') || position.pos.includes('DM') ? baseLevel + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 30) + 20,
            heading: position.pos.includes('B') || position.pos.includes('T') ? baseLevel + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 30) + 20,
            crossing: position.pos.includes('B') || position.pos.includes('W') ? baseLevel + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 30) + 20,
            finishing: position.pos.includes('T') || position.pos.includes('W') ? baseLevel + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 30) + 20,
            
            // Potencial (respeitando constraint)
            potential: Math.floor(Math.random() * (potentialRange[1] - potentialRange[0])) + potentialRange[0],
            
            // Informações contratuais
            salary_monthly: Math.floor(Math.random() * 50000) + 10000,
            contract_end_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            signing_bonus: Math.floor(Math.random() * 100000) + 50000,
            release_clause: Math.floor(Math.random() * 1000000) + 500000,
            
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
            injury_proneness: Math.floor(Math.random() * 20) + 10,
            injury_type: null,
            injury_severity: null,
            injury_return_date: null,
            
            // Desenvolvimento
            development_rate: Math.floor(Math.random() * 20) + 40,
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
    }

    // 5. Verificar resultado final
    console.log('\n📊 5. Verificando resultado final...');
    
    const { data: finalPlayers, error: finalError } = await supabase
      .from('game_players')
      .select('team_id, COUNT(*)', { count: 'exact', head: true })
      .group('team_id');

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`📊 Total de jogadores criados: ${totalCreated}`);
      console.log(`📊 Total de erros: ${totalErrors}`);
      
      // Agrupar por time
      const finalPlayersPerTeam = {};
      finalPlayers?.forEach(item => {
        finalPlayersPerTeam[item.team_id] = parseInt(item.count);
      });

      console.log('\n🏟️ JOGADORES POR TIME:');
      machineTeams?.forEach(team => {
        const playerCount = finalPlayersPerTeam[team.id] || 0;
        console.log(`   • ${team.name}: ${playerCount} jogadores`);
      });
    }

    // 6. Resumo final
    console.log('\n🎉 CRIAÇÃO DE JOGADORES CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ✅ ${totalCreated} novos jogadores criados`);
    console.log(`   • ❌ ${totalErrors} erros encontrados`);
    console.log(`   • 🏟️ ${machineTeams?.length || 0} times da máquina`);
    console.log(`   • ⚽ Sistema pronto para simulação de partidas`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Testar criação de novo time de usuário');
    console.log('   2. Verificar se todos os jogadores foram criados');
    console.log('   3. Testar simulação de partidas');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

function generatePlayerName(position) {
  const firstNames = ['João', 'Pedro', 'Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Bruno', 'Carlos', 'André', 'Felipe'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Pereira', 'Lima', 'Costa'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
}

createCompleteMachineTeams();
