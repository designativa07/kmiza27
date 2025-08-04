const { getSupabaseClient } = require('../config/supabase-connection');

async function populateMissingMachineTeams() {
  try {
    console.log('🧪 CORREÇÃO: Populando times da máquina faltantes\n');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Verificar times existentes por série
    console.log('1️⃣ Verificando times existentes...');
    const { data: existingTeams } = await supabase
      .from('game_machine_teams')
      .select('*')
      .order('tier', { ascending: true })
      .order('name');
    
    const teamsByTier = {};
    existingTeams?.forEach(team => {
      if (!teamsByTier[team.tier]) {
        teamsByTier[team.tier] = [];
      }
      teamsByTier[team.tier].push(team);
    });
    
    console.log('📊 Times existentes por série:');
    [1, 2, 3, 4].forEach(tier => {
      const count = teamsByTier[tier]?.length || 0;
      const tierName = getTierName(tier);
      console.log(`   Série ${tierName}: ${count}/19 times ${count === 19 ? '✅' : '❌'}`);
    });
    
    // 2. Definir times da máquina por série conforme GUIA_IA_GAME.md
    const machineTeamsByTier = {
      4: [ // Série D (Entrada)
        'Atlético Brasiliense', 'Real DF', 'Gama FC', 'Vila Nova GO',
        'Aparecidense', 'Brasiliense FC', 'Ceilândia EC', 'Sobradinho EC',
        'Luziânia EC', 'Formosa EC', 'Anápolis FC', 'Cristalina FC',
        'Planaltina EC', 'Valparaíso FC', 'Águas Lindas FC', 'Novo Gama FC',
        'Santo Antônio EC', 'Alexânia FC', 'Goianésia EC'
      ],
      3: [ // Série C
        'Guarani SP', 'Ponte Preta', 'Ituano', 'Mirassol', 'Novorizontino',
        'Botafogo SP', 'Portuguesa', 'Santo André', 'São José SP',
        'Vila Nova GO', 'Goiás', 'Atlético GO', 'Tombense', 'Caldense',
        'América MG', 'Villa Nova MG', 'URT', 'Patrocinense', 'Athletic Club'
      ],
      2: [ // Série B
        'Santos', 'Guarani', 'Ponte Preta', 'Novorizontino', 'Mirassol',
        'Sport', 'Náutico', 'Vila Nova', 'Goiás', 'Coritiba', 'Avaí',
        'Chapecoense', 'Londrina', 'Operário PR', 'CRB', 'CSA',
        'Botafogo PB', 'Sampaio Corrêa', 'Paysandu'
      ],
      1: [ // Série A (Elite)
        'Flamengo', 'Palmeiras', 'São Paulo', 'Corinthians', 'Santos',
        'Grêmio', 'Internacional', 'Atlético MG', 'Cruzeiro', 'Botafogo',
        'Fluminense', 'Vasco', 'Fortaleza', 'Ceará', 'Bahia', 'Vitória',
        'Athletico PR', 'Coritiba', 'Cuiabá'
      ]
    };
    
    // 3. Popular times faltantes
    console.log('\n2️⃣ Populando times faltantes...');
    
    for (const [tier, teamNames] of Object.entries(machineTeamsByTier)) {
      const tierNum = parseInt(tier);
      const tierName = getTierName(tierNum);
      const existing = teamsByTier[tierNum] || [];
      const existingNames = existing.map(t => t.name);
      
      console.log(`\n📋 Série ${tierName}:`);
      
      const missingTeams = teamNames.filter(name => !existingNames.includes(name));
      
      if (missingTeams.length === 0) {
        console.log(`   ✅ Todos os ${teamNames.length} times já existem`);
        continue;
      }
      
      console.log(`   📝 Adicionando ${missingTeams.length} times faltantes...`);
      
      for (const teamName of missingTeams) {
        // Calcular atributos baseados na série
        const baseAttributes = getBaseAttributesByTier(tierNum);
        
        const teamData = {
          name: teamName,
          tier: tierNum,
          attributes: baseAttributes,
          stadium_name: `Estádio ${teamName}`,
          stadium_capacity: 20000 + Math.floor(Math.random() * 30000), // 20k-50k
          colors: generateTeamColors(),
          display_order: teamNames.indexOf(teamName) + 1,
          is_active: true
        };
        
        const { error } = await supabase
          .from('game_machine_teams')
          .insert(teamData);
        
        if (error) {
          console.log(`   ❌ Erro ao criar ${teamName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${teamName} criado`);
        }
      }
    }
    
    // 4. Verificar resultado final
    console.log('\n3️⃣ Verificando resultado final...');
    const { data: finalTeams } = await supabase
      .from('game_machine_teams')
      .select('tier')
      .order('tier');
    
    const finalCounts = {};
    finalTeams?.forEach(team => {
      finalCounts[team.tier] = (finalCounts[team.tier] || 0) + 1;
    });
    
    console.log('📊 Times finais por série:');
    let allCorrect = true;
    [1, 2, 3, 4].forEach(tier => {
      const count = finalCounts[tier] || 0;
      const tierName = getTierName(tier);
      const isCorrect = count === 19;
      if (!isCorrect) allCorrect = false;
      console.log(`   Série ${tierName}: ${count}/19 times ${isCorrect ? '✅' : '❌'}`);
    });
    
    console.log('\n🎯 RESULTADO:');
    if (allCorrect) {
      console.log('✅ SUCESSO! Todas as séries têm 19 times da máquina');
      console.log('✅ O algoritmo round-robin corrigido funcionará perfeitamente');
      console.log('🎮 Agora você pode jogar e testar a consistência dos jogos!');
    } else {
      console.log('⚠️ Algumas séries ainda não têm 19 times');
      console.log('💡 Pode ser necessário executar novamente ou verificar erros');
    }
    
  } catch (error) {
    console.error('❌ Erro na população:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || `${tier}`;
}

function getBaseAttributesByTier(tier) {
  // Atributos médios por série conforme GUIA_IA_GAME.md
  const baseByTier = {
    1: 87.5, // Série A: 80-95
    2: 77.5, // Série B: 70-85  
    3: 67.5, // Série C: 60-75
    4: 57.5  // Série D: 50-65
  };
  
  const base = baseByTier[tier] || 57.5;
  const variation = 7.5; // ±7.5 para criar variedade
  
  return Math.round((base + (Math.random() - 0.5) * variation * 2) * 10) / 10;
}

function generateTeamColors() {
  const colors = [
    { primary: '#FF0000', secondary: '#FFFFFF' }, // Vermelho/Branco
    { primary: '#0000FF', secondary: '#FFFFFF' }, // Azul/Branco
    { primary: '#008000', secondary: '#FFFFFF' }, // Verde/Branco
    { primary: '#000000', secondary: '#FFFFFF' }, // Preto/Branco
    { primary: '#FFD700', secondary: '#000000' }, // Amarelo/Preto
    { primary: '#800080', secondary: '#FFFFFF' }, // Roxo/Branco
    { primary: '#FFA500', secondary: '#000000' }, // Laranja/Preto
    { primary: '#FF69B4', secondary: '#FFFFFF' }  // Rosa/Branco
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// Executar
populateMissingMachineTeams();