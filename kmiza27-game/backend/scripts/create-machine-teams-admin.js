const { getSupabaseServiceClient } = require('../config/supabase-connection');

const machineTeams = [
  // SÉRIE D (8 times)
  { name: "Botafogo-PB", tier: 4, short_name: "BOT-PB", colors: { primary: "#000000", secondary: "#ffffff" } },
  { name: "Confiança-SE", tier: 4, short_name: "CON-SE", colors: { primary: "#ff0000", secondary: "#ffffff" } },
  { name: "Ferroviário-CE", tier: 4, short_name: "FER-CE", colors: { primary: "#0000ff", secondary: "#ffffff" } },
  { name: "Globo-RN", tier: 4, short_name: "GLO-RN", colors: { primary: "#ff6600", secondary: "#ffffff" } },
  { name: "Imperatriz-MA", tier: 4, short_name: "IMP-MA", colors: { primary: "#00ff00", secondary: "#000000" } },
  { name: "Juventude-RS", tier: 4, short_name: "JUV-RS", colors: { primary: "#ff00ff", secondary: "#ffffff" } },
  { name: "Londrina-PR", tier: 4, short_name: "LON-PR", colors: { primary: "#ffff00", secondary: "#000000" } },
  { name: "Volta Redonda-RJ", tier: 4, short_name: "VOL-RJ", colors: { primary: "#00ffff", secondary: "#000000" } },

  // SÉRIE C (8 times)
  { name: "ABC-RN", tier: 3, short_name: "ABC-RN", colors: { primary: "#ff0000", secondary: "#ffffff" } },
  { name: "Botafogo-SP", tier: 3, short_name: "BOT-SP", colors: { primary: "#000000", secondary: "#ffffff" } },
  { name: "Brusque-SC", tier: 3, short_name: "BRU-SC", colors: { primary: "#00ff00", secondary: "#ffffff" } },
  { name: "Criciúma-SC", tier: 3, short_name: "CRI-SC", colors: { primary: "#ffff00", secondary: "#000000" } },
  { name: "Ituano-SP", tier: 3, short_name: "ITU-SP", colors: { primary: "#ff6600", secondary: "#ffffff" } },
  { name: "Londrina-PR", tier: 3, short_name: "LON-PR", colors: { primary: "#0000ff", secondary: "#ffffff" } },
  { name: "Paysandu-PA", tier: 3, short_name: "PAY-PA", colors: { primary: "#ff00ff", secondary: "#ffffff" } },
  { name: "Vila Nova-GO", tier: 3, short_name: "VIL-GO", colors: { primary: "#00ffff", secondary: "#000000" } },

  // SÉRIE B (4 times)
  { name: "Avaí-SC", tier: 2, short_name: "AVA-SC", colors: { primary: "#00ff00", secondary: "#ffffff" } },
  { name: "Botafogo-RJ", tier: 2, short_name: "BOT-RJ", colors: { primary: "#000000", secondary: "#ffffff" } },
  { name: "Cruzeiro-MG", tier: 2, short_name: "CRU-MG", colors: { primary: "#0000ff", secondary: "#ffffff" } },
  { name: "Vasco da Gama-RJ", tier: 2, short_name: "VAS-RJ", colors: { primary: "#ffffff", secondary: "#000000" } }
];

async function createMachineTeams() {
  try {
    console.log('🤖 Criando times da máquina (modo admin)...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    for (const teamData of machineTeams) {
      // Verificar se o time já existe
      const { data: existingTeam, error: checkError } = await supabase
        .from('game_teams')
        .select('id')
        .eq('name', teamData.name)
        .single();

      if (existingTeam) {
        console.log(`⏭️ Time ${teamData.name} já existe, pulando...`);
        continue;
      }

      // Criar time da máquina
      const { data: newTeam, error: createError } = await supabase
        .from('game_teams')
        .insert({
          name: teamData.name,
          short_name: teamData.short_name,
          slug: teamData.short_name.toLowerCase().replace('-', '-'),
          owner_id: '22fa9e4b-858e-49b5-b80c-1390f9665ac9', // Usuário padrão da máquina
          team_type: 'machine',
          colors: teamData.colors,
          logo_url: null,
          stadium_name: `${teamData.name} Stadium`,
          stadium_capacity: 25000 + (Math.floor(Math.random() * 15000)),
          budget: 1000000 + (Math.floor(Math.random() * 2000000)),
          reputation: 50 + (Math.floor(Math.random() * 30)),
          fan_base: 1000 + (Math.floor(Math.random() * 5000)),
          game_stats: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error(`❌ Erro ao criar time ${teamData.name}:`, createError);
        continue;
      }

      console.log(`✅ Time criado: ${newTeam.name} (Série ${teamData.tier})`);

      // Criar 23 jogadores para o time
      await createPlayersForTeam(newTeam.id, newTeam.name);
    }

    console.log('🎉 Todos os times da máquina foram criados!');
    
  } catch (error) {
    console.error('❌ Erro ao criar times da máquina:', error);
  }
}

async function createPlayersForTeam(teamId, teamName) {
  try {
    const positions = [
      { name: 'Goleiro', count: 3 },
      { name: 'Zagueiro', count: 4 },
      { name: 'Lateral Esquerdo', count: 2 },
      { name: 'Lateral Direito', count: 2 },
      { name: 'Volante', count: 2 },
      { name: 'Meia Central', count: 2 },
      { name: 'Meia Ofensivo', count: 2 },
      { name: 'Ponta Esquerda', count: 1 },
      { name: 'Ponta Direita', count: 1 },
      { name: 'Atacante', count: 2 },
      { name: 'Centroavante', count: 2 }
    ];

    const supabase = getSupabaseServiceClient('vps');
    let playerNumber = 1;

    for (const position of positions) {
      for (let i = 0; i < position.count; i++) {
        const player = generatePlayer(teamId, position.name, playerNumber);
        
        const { error: createError } = await supabase
          .from('youth_players')
          .insert(player);

        if (createError) {
          console.error(`❌ Erro ao criar jogador ${player.name}:`, createError);
        } else {
          console.log(`👤 Jogador criado: ${player.name} (${position.name})`);
        }

        playerNumber++;
      }
    }

    console.log(`✅ 23 jogadores criados para ${teamName}`);
    
  } catch (error) {
    console.error(`❌ Erro ao criar jogadores para ${teamName}:`, error);
  }
}

function generatePlayer(teamId, position, playerNumber) {
  const names = [
    'João Silva', 'Pedro Santos', 'Carlos Oliveira', 'Miguel Costa', 'Lucas Pereira',
    'Gabriel Lima', 'Rafael Souza', 'Daniel Alves', 'Thiago Costa', 'André Santos',
    'Felipe Silva', 'Bruno Oliveira', 'Marcos Lima', 'Roberto Costa', 'Paulo Santos',
    'Ricardo Alves', 'Fernando Lima', 'Eduardo Costa', 'Alexandre Santos', 'Diego Silva'
  ];

  const name = names[Math.floor(Math.random() * names.length)];
  const attributes = generatePlayerAttributes(position);

  return {
    team_id: teamId,
    name: name,
    position: position,
    number: playerNumber,
    age: 18 + Math.floor(Math.random() * 12),
    pace: attributes.pace,
    shooting: attributes.shooting,
    passing: attributes.passing,
    dribbling: attributes.dribbling,
    defending: attributes.defending,
    physical: attributes.physical,
    potential: generatePlayerPotential(attributes),
    overall: Math.floor((attributes.pace + attributes.shooting + attributes.passing + 
                        attributes.dribbling + attributes.defending + attributes.physical) / 6),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function generatePlayerAttributes(position) {
  const baseAttributes = {
    pace: 50 + Math.floor(Math.random() * 30),
    shooting: 50 + Math.floor(Math.random() * 30),
    passing: 50 + Math.floor(Math.random() * 30),
    dribbling: 50 + Math.floor(Math.random() * 30),
    defending: 50 + Math.floor(Math.random() * 30),
    physical: 50 + Math.floor(Math.random() * 30)
  };

  // Ajustar atributos baseado na posição
  switch (position) {
    case 'Goleiro':
      baseAttributes.defending = 75 + Math.floor(Math.random() * 15);
      baseAttributes.physical = 70 + Math.floor(Math.random() * 15);
      baseAttributes.pace = 30 + Math.floor(Math.random() * 20);
      break;
    case 'Zagueiro':
      baseAttributes.defending = 70 + Math.floor(Math.random() * 15);
      baseAttributes.physical = 70 + Math.floor(Math.random() * 15);
      break;
    case 'Lateral Esquerdo':
    case 'Lateral Direito':
      baseAttributes.pace = 70 + Math.floor(Math.random() * 15);
      baseAttributes.defending = 65 + Math.floor(Math.random() * 15);
      break;
    case 'Volante':
      baseAttributes.defending = 70 + Math.floor(Math.random() * 15);
      baseAttributes.physical = 70 + Math.floor(Math.random() * 15);
      break;
    case 'Meia Central':
      baseAttributes.passing = 70 + Math.floor(Math.random() * 15);
      baseAttributes.dribbling = 65 + Math.floor(Math.random() * 15);
      break;
    case 'Meia Ofensivo':
      baseAttributes.passing = 70 + Math.floor(Math.random() * 15);
      baseAttributes.dribbling = 70 + Math.floor(Math.random() * 15);
      break;
    case 'Ponta Esquerda':
    case 'Ponta Direita':
      baseAttributes.pace = 70 + Math.floor(Math.random() * 15);
      baseAttributes.dribbling = 70 + Math.floor(Math.random() * 15);
      break;
    case 'Atacante':
      baseAttributes.shooting = 70 + Math.floor(Math.random() * 15);
      baseAttributes.pace = 70 + Math.floor(Math.random() * 15);
      break;
    case 'Centroavante':
      baseAttributes.shooting = 70 + Math.floor(Math.random() * 15);
      baseAttributes.physical = 65 + Math.floor(Math.random() * 15);
      break;
  }

  return baseAttributes;
}

function generatePlayerPotential(attributes) {
  const currentOverall = Math.floor((attributes.pace + attributes.shooting + attributes.passing + 
                                    attributes.dribbling + attributes.defending + attributes.physical) / 6);
  
  // Potencial pode ser até 20 pontos maior que o overall atual
  return Math.min(99, currentOverall + Math.floor(Math.random() * 20));
}

// Executar script
createMachineTeams(); 