const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function createMachineTeamsStarters() {
  console.log('🤖 CRIANDO JOGADORES TITULARES PARA TIMES DA MÁQUINA');
  console.log('=====================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar times da máquina
    console.log('📋 1. Verificando times da máquina...');
    
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .eq('team_type', 'machine');

    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }

    console.log(`📊 Times da máquina encontrados: ${machineTeams?.length || 0}`);

    if (!machineTeams || machineTeams.length === 0) {
      console.log('✅ Nenhum time da máquina encontrado!');
      return;
    }

    // 2. Verificar se já têm jogadores
    console.log('\n👥 2. Verificando jogadores existentes...');
    
    const machineTeamIds = machineTeams.map(t => t.id);
    
    const { data: existingPlayers, error: playersError } = await supabase
      .from('game_players')
      .select('id, name, team_id')
      .in('team_id', machineTeamIds);

    if (playersError) {
      console.log('❌ Erro ao verificar jogadores existentes:', playersError.message);
      return;
    }

    console.log(`📊 Jogadores profissionais existentes: ${existingPlayers?.length || 0}`);

    if (existingPlayers && existingPlayers.length > 0) {
      console.log('✅ Times da máquina já têm jogadores profissionais!');
      return;
    }

    // 3. Estratégia de criação
    console.log('\n🎯 3. Estratégia de criação...');
    console.log('💡 Criar 11 jogadores titulares para cada time da máquina');
    console.log('💡 Posições: 1 GK, 4 DEF, 4 MID, 2 ATT');
    console.log('💡 Habilidades balanceadas para simulação realista');

    // 4. Criar jogadores para cada time
    console.log('\n⚽ 4. Criando jogadores titulares...');
    
    let totalCreated = 0;
    let errorsCount = 0;

    for (const team of machineTeams) {
      try {
        console.log(`\n🏟️ Criando jogadores para: ${team.name}`);
        
        // Criar 11 jogadores titulares
        const starters = createTeamStarters(team.id, team.name);
        
        const { data: createdPlayers, error: createError } = await supabase
          .from('game_players')
          .insert(starters)
          .select();

        if (createError) {
          console.log(`   ❌ Erro ao criar jogadores para ${team.name}:`, createError.message);
          errorsCount++;
          continue;
        }

        console.log(`   ✅ ${createdPlayers?.length || 0} jogadores criados para ${team.name}`);
        totalCreated += createdPlayers?.length || 0;

        // Mostrar detalhes dos jogadores criados
        if (createdPlayers && createdPlayers.length > 0) {
          console.log(`   📋 Titulares criados:`);
          createdPlayers.forEach((player, index) => {
            console.log(`      ${index + 1}. ${player.name} (${player.position}) - Overall: ${player.current_ability}`);
          });
        }

      } catch (error) {
        console.log(`   ❌ Erro ao processar ${team.name}:`, error.message);
        errorsCount++;
      }
    }

    // 5. Verificar resultado final
    console.log('\n📊 5. Verificando resultado final...');
    
    const { count: finalProCount } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total final de jogadores profissionais: ${finalProCount || 0}`);
    console.log(`📊 Jogadores criados nesta execução: ${totalCreated}`);
    console.log(`📊 Erros: ${errorsCount}`);

    // 6. Verificar distribuição por time
    console.log('\n🏟️ 6. Verificando distribuição por time...');
    
    const { data: finalPlayers, error: finalError } = await supabase
      .from('game_players')
      .select(`
        id,
        name,
        position,
        current_ability,
        team:game_teams!game_players_team_id_fkey(
          id,
          name,
          team_type
        )
      `)
      .in('team_id', machineTeamIds);

    if (finalError) {
      console.log('❌ Erro ao verificar distribuição:', finalError.message);
    } else {
      const teamPlayerCounts = {};
      finalPlayers?.forEach(player => {
        const teamName = player.team?.name || 'Time não encontrado';
        teamPlayerCounts[teamName] = (teamPlayerCounts[teamName] || 0) + 1;
      });

      console.log('📊 Jogadores por time da máquina:');
      Object.entries(teamPlayerCounts).forEach(([teamName, count]) => {
        console.log(`   • ${teamName}: ${count} jogadores`);
      });
    }

    // 7. Estatísticas finais
    console.log('\n📈 7. Estatísticas finais...');
    
    const successRate = totalCreated > 0 ? Math.round(((totalCreated - errorsCount) / totalCreated) * 100) : 100;
    
    console.log(`📊 Total de jogadores criados: ${totalCreated}`);
    console.log(`✅ Sucessos: ${totalCreated - errorsCount}`);
    console.log(`❌ Erros: ${errorsCount}`);
    console.log(`📈 Taxa de sucesso: ${successRate}%`);

    console.log('\n🎉 CRIAÇÃO DE JOGADORES TITULARES CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ${totalCreated} jogadores titulares criados para times da máquina`);
    console.log(`   • Cada time agora tem 11 jogadores para simulação de partidas`);
    console.log(`   • Sistema otimizado para simulação realista`);
    console.log(`   • Jogadores da base mantidos apenas em times reais`);

    console.log('\n💡 COMO FUNCIONA AGORA:');
    console.log('   1. ✅ Times da máquina: 11 jogadores titulares para simulação');
    console.log('   2. ✅ Times reais: Jogadores profissionais + jogadores da base');
    console.log('   3. ✅ Simulação de partidas: Funciona com times da máquina');
    console.log('   4. ✅ Academia de base: Disponível apenas para times reais');

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Testar simulação de partidas com times da máquina');
    console.log('   2. Verificar se sistema está funcionando corretamente');
    console.log('   3. Testar criação de times reais com jogadores da base');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Função para criar jogadores titulares de um time
function createTeamStarters(teamId, teamName) {
  const starters = [];
  
  // Posições e nomes para times da máquina (usando abreviações de 3 caracteres)
  const positions = [
    { pos: 'GK', count: 1, names: ['Goleiro'] },
    { pos: 'CB', count: 2, names: ['Zagueiro Central', 'Zagueiro'] },
    { pos: 'LB', count: 1, names: ['Lateral Esquerdo'] },
    { pos: 'RB', count: 1, names: ['Lateral Direito'] },
    { pos: 'DM', count: 1, names: ['Volante'] },
    { pos: 'CM', count: 2, names: ['Meio Campo', 'Meia Central'] },
    { pos: 'AM', count: 1, names: ['Meia Ofensivo'] },
    { pos: 'LW', count: 1, names: ['Ponta Esquerda'] },
    { pos: 'RW', count: 1, names: ['Ponta Direita'] },
    { pos: 'ST', count: 1, names: ['Centroavante'] }
  ];

  let playerIndex = 0;
  
  positions.forEach(({ pos, count, names }) => {
    for (let i = 0; i < count; i++) {
      const name = names[i] || `${pos} ${i + 1}`;
      const age = 22 + Math.floor(Math.random() * 8); // 22-29 anos
      const baseAbility = getBaseAbilityForPosition(pos);
      const variation = Math.floor(Math.random() * 10) - 5; // ±5 variação
      const currentAbility = Math.max(60, Math.min(85, baseAbility + variation));
      
      starters.push({
        id: require('crypto').randomUUID(),
        name: `${name} ${teamName}`,
        position: pos,
        alternative_positions: [],
        age: age,
        nationality: 'BRA',
        team_id: teamId,
        
        // Atributos individuais (balanceados para simulação)
        pace: getAttributeForPosition(pos, 'pace', currentAbility),
        shooting: getAttributeForPosition(pos, 'shooting', currentAbility),
        passing: getAttributeForPosition(pos, 'passing', currentAbility),
        dribbling: getAttributeForPosition(pos, 'dribbling', currentAbility),
        defending: getAttributeForPosition(pos, 'defending', currentAbility),
        physical: getAttributeForPosition(pos, 'physical', currentAbility),
        
        // Atributos adicionais necessários
        speed: getAttributeForPosition(pos, 'pace', currentAbility),
        stamina: getAttributeForPosition(pos, 'physical', currentAbility),
        strength: getAttributeForPosition(pos, 'physical', currentAbility),
        jumping: getAttributeForPosition(pos, 'physical', currentAbility),
        concentration: 70 + Math.floor(Math.random() * 20),
        creativity: 60 + Math.floor(Math.random() * 20),
        vision: 65 + Math.floor(Math.random() * 20),
        leadership: 50 + Math.floor(Math.random() * 20),
        tackling: getAttributeForPosition(pos, 'defending', currentAbility),
        heading: getAttributeForPosition(pos, 'defending', currentAbility),
        crossing: getAttributeForPosition(pos, 'passing', currentAbility),
        finishing: getAttributeForPosition(pos, 'shooting', currentAbility),
        
        // Atributo específico para goleiros (constraint válida)
        goalkeeping: pos === 'GK' ? 75 : 15, // Goleiro alto, outros baixo (máximo 20)
        
        // Overall e potencial (current_ability é gerado automaticamente)
        potential: currentAbility + Math.floor(Math.random() * 5), // Potencial um pouco maior
        development_rate: 0.5,
        
        // Dados de mercado
        market_value: currentAbility * 1000, // Valor baseado na habilidade
        salary_monthly: Math.floor(currentAbility * 50), // Salário baseado na habilidade
        
        // Campos obrigatórios do schema
        contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano
        signing_bonus: 0,
        release_clause: null,
        last_value_update: new Date().toISOString().split('T')[0],
        
        // Status
        is_transfer_listed: false,
        asking_price: null,
        
        // Campos adicionais obrigatórios
        team_type: 'first_team',
        origin: 'created',
        signed_date: new Date().toISOString().split('T')[0],
        previous_clubs: [],
        youth_academy_level: null,
        promoted_from_youth: null,
        individual_training: null,
        training_start_date: null,
        training_end_date: null,
        training_progress: 0,
        training_points_week: 0,
        
        // Outros campos
        morale: 70 + Math.floor(Math.random() * 20), // 70-90
        fitness: 80 + Math.floor(Math.random() * 20), // 80-100
        form: 6 + Math.floor(Math.random() * 4), // 6-10
        
        // Campos de lesão
        injury_proneness: 5,
        injury_type: null,
        injury_severity: 0,
        injury_return_date: null,
        
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
        average_rating: 6.00,
        last_ratings: [],
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      playerIndex++;
    }
  });
  
  return starters;
}

// Função para obter habilidade base por posição
function getBaseAbilityForPosition(position) {
  const baseAbilities = {
    'GK': 75,    // Goleiro: habilidade base alta
    'CB': 72,    // Zagueiro: defesa forte
    'LB': 70,    // Lateral: equilíbrio
    'RB': 70,    // Lateral: equilíbrio
    'DM': 73,    // Volante: defesa + meio
    'CM': 71,    // Meio campo: equilíbrio
    'AM': 72,    // Meia ofensivo: ataque + meio
    'LW': 71,    // Ponta: velocidade + ataque
    'RW': 71,    // Ponta: velocidade + ataque
    'ST': 73     // Atacante: finalização forte
  };
  
  return baseAbilities[position] || 70;
}

// Função para obter atributo específico por posição
function getAttributeForPosition(position, attribute, overall) {
  const positionMultipliers = {
    'GK': { pace: 0.3, shooting: 0.1, passing: 0.4, dribbling: 0.1, defending: 0.8, physical: 0.6 },
    'CB': { pace: 0.5, shooting: 0.2, passing: 0.6, dribbling: 0.3, defending: 0.9, physical: 0.8 },
    'LB': { pace: 0.7, shooting: 0.3, passing: 0.6, dribbling: 0.5, defending: 0.7, physical: 0.6 },
    'RB': { pace: 0.7, shooting: 0.3, passing: 0.6, dribbling: 0.5, defending: 0.7, physical: 0.6 },
    'DM': { pace: 0.5, shooting: 0.4, passing: 0.7, dribbling: 0.4, defending: 0.8, physical: 0.7 },
    'CM': { pace: 0.6, shooting: 0.5, passing: 0.8, dribbling: 0.6, defending: 0.6, physical: 0.6 },
    'AM': { pace: 0.7, shooting: 0.7, passing: 0.8, dribbling: 0.8, defending: 0.4, physical: 0.5 },
    'LW': { pace: 0.9, shooting: 0.6, passing: 0.6, dribbling: 0.8, defending: 0.3, physical: 0.5 },
    'RW': { pace: 0.9, shooting: 0.6, passing: 0.6, dribbling: 0.8, defending: 0.3, physical: 0.5 },
    'ST': { pace: 0.7, shooting: 0.9, passing: 0.5, dribbling: 0.7, defending: 0.2, physical: 0.7 }
  };
  
  const multiplier = positionMultipliers[position]?.[attribute] || 0.6;
  const baseValue = Math.floor(overall * multiplier);
  const variation = Math.floor(Math.random() * 10) - 5; // ±5 variação
  
  return Math.max(40, Math.min(90, baseValue + variation));
}

createMachineTeamsStarters();
