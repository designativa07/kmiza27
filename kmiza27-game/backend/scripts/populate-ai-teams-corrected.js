const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function populateAITeamsCorrected() {
  console.log('🎮 POPULAÇÃO CORRIGIDA DOS TIMES DA IA COM JOGADORES');
  console.log('=====================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Buscar times da IA
    console.log('🤖 1. Buscando times da IA...');
    const { data: aiTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('is_user_team', false);

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    console.log(`📋 Encontrados ${aiTeams.length} times da IA para popular\n`);

    let totalYouthPlayers = 0;
    let totalProfessionalPlayers = 0;

    // 2. Popular cada time
    for (const team of aiTeams) {
      console.log(`🏟️ Populando time: ${team.name}`);

      // Gerar jogadores da base (youth_players)
      const youthPlayers = generateYouthPlayers(23, team.id);
      
      try {
        const { data: youthData, error: youthError } = await supabase
          .from('youth_players')
          .insert(youthPlayers)
          .select();

        if (youthError) {
          console.log(`❌ Erro ao inserir jogadores da base para ${team.name}:`, youthError.message);
        } else {
          console.log(`✅ ${youthData.length} jogadores da base inseridos`);
          totalYouthPlayers += youthData.length;
        }
      } catch (error) {
        console.log(`❌ Erro na inserção da base:`, error.message);
      }

      // Gerar jogadores profissionais (game_players)
      const professionalPlayers = generateProfessionalPlayers(23, team.id);
      
      try {
        const { data: proData, error: proError } = await supabase
          .from('game_players')
          .insert(professionalPlayers)
          .select();

        if (proError) {
          console.log(`❌ Erro ao inserir jogadores profissionais para ${team.name}:`, proError.message);
        } else {
          console.log(`✅ ${proData.length} jogadores profissionais inseridos`);
          totalProfessionalPlayers += proData.length;
        }
      } catch (error) {
        console.log(`❌ Erro na inserção profissional:`, error.message);
      }

      console.log('');
    }

    // 3. Verificar resultado final
    console.log('📊 3. Verificando resultado final...');
    const { count: finalYouthCount } = await supabase
      .from('youth_players')
      .select('*', { count: 'exact', head: true });

    const { count: finalProCount } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true });

    console.log(`👶 Total de jogadores da base: ${finalYouthCount || 0}`);
    console.log(`👨‍💼 Total de jogadores profissionais: ${finalProCount || 0}`);
    console.log(`🎯 Total geral de jogadores: ${(finalYouthCount || 0) + (finalProCount || 0)}`);

    console.log('\n🧠 4. Testando IA do mercado...');
    console.log('💡 Agora você pode clicar em "Executar IA do Mercado" para testar!');
    console.log('📋 A IA deve listar alguns jogadores no mercado (máximo 2 por time)');

    console.log('\n🎉 POPULAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📝 RESUMO:');
    console.log('   • Times da IA populados');
    console.log('   • Jogadores criados no total');
    console.log('   • Mercado agora pode ser abastecido pela IA');
    console.log('   • Sistema equilibrado e jogável');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

function generateYouthPlayers(count, teamId) {
  const players = [];
  const positions = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
  const nationalities = ['Brasil', 'Argentina', 'Uruguai', 'Chile', 'Colômbia'];
  
  for (let i = 1; i <= count; i++) {
    const position = positions[Math.floor(Math.random() * positions.length)];
    const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];
    const age = 16 + Math.floor(Math.random() * 5); // 16-20 anos
    const dateOfBirth = new Date(2005 - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    
    players.push({
      id: `youth-${teamId}-${i}-${Date.now()}`,
      name: generatePlayerName(i),
      position: position,
      date_of_birth: dateOfBirth.toISOString().split('T')[0],
      nationality: nationality,
      team_id: teamId,
      potential: 60 + Math.floor(Math.random() * 30), // 60-89
      attributes: generateAttributes(position),
      status: 'available',
      age: age,
      is_youth: true,
      foot: Math.random() > 0.5 ? 'R' : 'L',
      personality: 'normal',
      style: 'mixed',
      morale: 70 + Math.floor(Math.random() * 20), // 70-89
      fitness: 80 + Math.floor(Math.random() * 20), // 80-99
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  return players;
}

function generateProfessionalPlayers(count, teamId) {
  const players = [];
  const positions = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
  const nationalities = ['Brasil', 'Argentina', 'Uruguai', 'Chile', 'Colômbia'];
  
  for (let i = 1; i <= count; i++) {
    const position = positions[Math.floor(Math.random() * positions.length)];
    const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];
    const age = 21 + Math.floor(Math.random() * 10); // 21-30 anos
    const dateOfBirth = new Date(2000 - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    
    players.push({
      id: `pro-${teamId}-${i}-${Date.now()}`,
      name: generatePlayerName(i),
      position: position,
      date_of_birth: dateOfBirth.toISOString().split('T')[0],
      nationality: nationality,
      team_id: teamId,
      potential: 65 + Math.floor(Math.random() * 25), // 65-89
      attributes: generateAttributes(position),
      status: 'available',
      age: age,
      is_youth: false,
      foot: Math.random() > 0.5 ? 'R' : 'L',
      personality: 'normal',
      style: 'mixed',
      morale: 70 + Math.floor(Math.random() * 20), // 70-89
      fitness: 80 + Math.floor(Math.random() * 20), // 80-99
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  return players;
}

function generatePlayerName(index) {
  const firstNames = ['João', 'Pedro', 'Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Bruno', 'Carlos', 'Diego', 'André'];
  const lastNames = ['Silva', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Alves', 'Lima', 'Souza', 'Oliveira', 'Ferreira'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName} Jr.${index}`;
}

function generateAttributes(position) {
  const baseAttributes = {
    pace: 40 + Math.floor(Math.random() * 40),
    passing: 40 + Math.floor(Math.random() * 40),
    physical: 40 + Math.floor(Math.random() * 40),
    shooting: 40 + Math.floor(Math.random() * 40),
    defending: 40 + Math.floor(Math.random() * 40),
    dribbling: 40 + Math.floor(Math.random() * 40)
  };

  // Ajustar atributos baseado na posição
  switch (position) {
    case 'GK':
      baseAttributes.defending = 60 + Math.floor(Math.random() * 30);
      baseAttributes.passing = 30 + Math.floor(Math.random() * 30);
      break;
    case 'CB':
      baseAttributes.defending = 60 + Math.floor(Math.random() * 30);
      baseAttributes.physical = 60 + Math.floor(Math.random() * 30);
      break;
    case 'ST':
      baseAttributes.shooting = 60 + Math.floor(Math.random() * 30);
      baseAttributes.pace = 50 + Math.floor(Math.random() * 30);
      break;
    case 'AM':
      baseAttributes.passing = 60 + Math.floor(Math.random() * 30);
      baseAttributes.dribbling = 60 + Math.floor(Math.random() * 30);
      break;
  }

  return baseAttributes;
}

populateAITeamsCorrected();
