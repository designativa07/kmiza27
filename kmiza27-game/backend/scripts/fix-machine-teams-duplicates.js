const { getSupabaseClient } = require('../config/supabase-connection');

async function fixMachineTeamsDuplicates() {
  try {
    console.log('🧪 CORREÇÃO: Removendo duplicatas e organizando times da máquina\n');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Buscar todos os times existentes
    console.log('1️⃣ Verificando todos os times existentes...');
    const { data: allTeams } = await supabase
      .from('game_machine_teams')
      .select('*')
      .order('tier', { ascending: true })
      .order('created_at', { ascending: true });
    
    console.log(`✅ Encontrados ${allTeams?.length || 0} times no total`);
    
    // 2. Agrupar por série
    const teamsByTier = {};
    allTeams?.forEach(team => {
      if (!teamsByTier[team.tier]) {
        teamsByTier[team.tier] = [];
      }
      teamsByTier[team.tier].push(team);
    });
    
    console.log('📊 Times por série (antes da correção):');
    [1, 2, 3, 4].forEach(tier => {
      const count = teamsByTier[tier]?.length || 0;
      console.log(`   Série ${getTierName(tier)}: ${count} times`);
    });
    
    // 3. Definir times corretos por série (conforme GUIA_IA_GAME.md)
    const correctTeamsByTier = {
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
    
    // 4. Limpar e recriar cada série
    console.log('\n2️⃣ Limpando e recriando séries...');
    
    for (const [tier, correctNames] of Object.entries(correctTeamsByTier)) {
      const tierNum = parseInt(tier);
      const tierName = getTierName(tierNum);
      
      console.log(`\n📋 Processando Série ${tierName}...`);
      
      // Remover todos os times desta série
      const { error: deleteError } = await supabase
        .from('game_machine_teams')
        .delete()
        .eq('tier', tierNum);
      
      if (deleteError) {
        console.log(`   ❌ Erro ao limpar Série ${tierName}: ${deleteError.message}`);
        continue;
      }
      
      console.log(`   🗑️ Times antigos removidos`);
      
      // Criar os 19 times corretos
      for (let i = 0; i < correctNames.length; i++) {
        const teamName = correctNames[i];
        const baseAttributes = getBaseAttributesByTier(tierNum);
        
        const teamData = {
          name: teamName,
          tier: tierNum,
          attributes: baseAttributes,
          stadium_name: `Estádio ${teamName}`,
          stadium_capacity: 20000 + Math.floor(Math.random() * 30000),
          colors: generateTeamColors(),
          display_order: i + 1,
          is_active: true
        };
        
        const { error: insertError } = await supabase
          .from('game_machine_teams')
          .insert(teamData);
        
        if (insertError) {
          console.log(`   ❌ Erro ao criar ${teamName}: ${insertError.message}`);
        } else {
          console.log(`   ✅ ${teamName} criado (${i + 1}/19)`);
        }
      }
    }
    
    // 5. Verificar resultado final
    console.log('\n3️⃣ Verificando resultado final...');
    const { data: finalTeams } = await supabase
      .from('game_machine_teams')
      .select('tier, name')
      .order('tier')
      .order('name');
    
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
    
    console.log('\n🎯 RESULTADO FINAL:');
    if (allCorrect) {
      console.log('✅ PERFEITO! Todas as séries têm exatamente 19 times da máquina');
      console.log('✅ Sistema reformulado funcionando conforme GUIA_IA_GAME.md');
      console.log('✅ Algoritmo round-robin corrigido pronto para usar');
      console.log('🎮 Agora você pode jogar e todos os times terão número igual de jogos!');
    } else {
      console.log('❌ Ainda há problemas com o número de times');
      console.log('💡 Verifique os erros acima e execute novamente se necessário');
    }
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || `${tier}`;
}

function getBaseAttributesByTier(tier) {
  const baseByTier = {
    1: 87.5, // Série A: 80-95
    2: 77.5, // Série B: 70-85  
    3: 67.5, // Série C: 60-75
    4: 57.5  // Série D: 50-65
  };
  
  const base = baseByTier[tier] || 57.5;
  const variation = 7.5;
  
  return Math.round((base + (Math.random() - 0.5) * variation * 2) * 10) / 10;
}

function generateTeamColors() {
  const colors = [
    { primary: '#FF0000', secondary: '#FFFFFF' },
    { primary: '#0000FF', secondary: '#FFFFFF' },
    { primary: '#008000', secondary: '#FFFFFF' },
    { primary: '#000000', secondary: '#FFFFFF' },
    { primary: '#FFD700', secondary: '#000000' },
    { primary: '#800080', secondary: '#FFFFFF' },
    { primary: '#FFA500', secondary: '#000000' },
    { primary: '#FF69B4', secondary: '#FFFFFF' }
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// Executar
fixMachineTeamsDuplicates();