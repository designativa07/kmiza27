// Teste simples para verificar a detecção de nomes de times
// Este script testa a lógica de extração de nomes de times

function removeAccents(str) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function testTeamNameDetection() {
  console.log('🧪 Testando lógica de detecção de nomes de times...\n');

  // Simular dados de times com aliases
  const teams = [
    {
      name: 'Avaí',
      short_name: 'AVA',
      slug: 'avai',
      aliases: ['avai', 'avai fc', 'avai futebol clube', 'leão da ilha', 'leao da ilha']
    },
    {
      name: 'Bahia',
      short_name: 'BAH',
      slug: 'bahia',
      aliases: ['bahia', 'bahia ec', 'tricolor', 'esporte clube bahia']
    },
    {
      name: 'Fluminense',
      short_name: 'FLU',
      slug: 'fluminense',
      aliases: ['flu', 'fluminense fc', 'tricolor carioca', 'fluminense futebol clube']
    }
  ];

  // Simular o processo de carregamento de nomes (como no OpenAIService)
  const teamNames = [];
  for (const team of teams) {
    teamNames.push(removeAccents(team.name.toLowerCase()));
    if (team.short_name) {
      teamNames.push(removeAccents(team.short_name.toLowerCase()));
    }
    if (team.slug) {
      teamNames.push(removeAccents(team.slug.toLowerCase()));
    }
    if (team.aliases && Array.isArray(team.aliases)) {
      for (const alias of team.aliases) {
        teamNames.push(removeAccents(alias.toLowerCase()));
      }
    }
  }
  
  // Remover duplicatas e ordenar por comprimento
  const uniqueTeamNames = [...new Set(teamNames)].sort((a, b) => b.length - a.length);

  console.log('📋 Lista de nomes de times carregados:');
  console.log(uniqueTeamNames);
  console.log('\n' + '='.repeat(60) + '\n');

  // Simular o método extractTeamName
  function extractTeamName(message) {
    const lowerMessage = message.toLowerCase();
    
    // Ordenar por comprimento (maiores primeiro) para evitar conflitos
    const sortedTeamNames = uniqueTeamNames.sort((a, b) => b.length - a.length);
    
    for (const teamName of sortedTeamNames) {
      let matched = false;
      
      // Para nomes curtos (<=3 chars), ser mais restritivo com word boundaries
      if (teamName.length <= 3) {
        const regex = new RegExp(`\\b${teamName}\\b`, 'i');
        if (regex.test(message)) {
          matched = true;
        }
      } else {
        // Para nomes longos, usar busca normal
        if (lowerMessage.includes(teamName.toLowerCase())) {
          matched = true;
        }
      }
      
      if (matched) {
        return teamName;
      }
    }
    
    return undefined;
  }

  // Simular o método extractSpecificMatch
  function extractSpecificMatch(message) {
    const lowerMessage = message.toLowerCase();
    
    // Padrões para detectar partidas específicas
    const patterns = [
      // Padrão: "Time1 x Time2" ou "Time1 vs Time2"
      /(\w+(?:\s+\w+)*)\s*(?:x|vs|versus)\s*(\w+(?:\s+\w+)*)/i,
      // Padrão: "Time1 contra Time2"
      /(\w+(?:\s+\w+)*)\s+contra\s+(\w+(?:\s+\w+)*)/i,
      // Padrão: "Time1 e Time2"
      /(\w+(?:\s+\w+)*)\s+e\s+(\w+(?:\s+\w+)*)/i
    ];
    
    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        const homeTeam = match[1].trim();
        const awayTeam = match[2].trim();
        
        console.log(`🔍 Padrão encontrado: "${homeTeam}" vs "${awayTeam}"`);
        
        // Verificar se ambos os times existem na lista de times conhecidos
        const homeTeamExists = uniqueTeamNames.some(team => 
          team.toLowerCase().includes(homeTeam.toLowerCase()) || 
          homeTeam.toLowerCase().includes(team.toLowerCase())
        );
        
        const awayTeamExists = uniqueTeamNames.some(team => 
          team.toLowerCase().includes(awayTeam.toLowerCase()) || 
          awayTeam.toLowerCase().includes(team.toLowerCase())
        );
        
        console.log(`   🏠 Home team "${homeTeam}": ${homeTeamExists ? '✅' : '❌'}`);
        console.log(`   🚌 Away team "${awayTeam}": ${awayTeamExists ? '✅' : '❌'}`);
        
        if (homeTeamExists && awayTeamExists) {
          // Retornar os nomes exatos dos times encontrados
          const foundHomeTeam = uniqueTeamNames.find(team => 
            team.toLowerCase().includes(homeTeam.toLowerCase()) || 
            homeTeam.toLowerCase().includes(team.toLowerCase())
          );
          
          const foundAwayTeam = uniqueTeamNames.find(team => 
            team.toLowerCase().includes(awayTeam.toLowerCase()) || 
            awayTeam.toLowerCase().includes(team.toLowerCase())
          );
          
          return {
            homeTeam: foundHomeTeam,
            awayTeam: foundAwayTeam
          };
        }
      }
    }
    
    return undefined;
  }

  // Testar diferentes variações para Avaí
  const testCases = [
    'Onde assistir Avaí x Bahia?',
    'Transmissão avai vs bahia',
    'Canais avai e bahia',
    'Onde passa avai x bahia',
    'Transmissão AVAÍ x BAHIA',
    'Canais Avai vs Bahia',
    'Onde assistir avai contra bahia',
    'Transmissão avai versus bahia'
  ];

  console.log('🔍 Testando detecção de partidas específicas:');
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testando: "${testCase}"`);
    
    try {
      const specificMatch = extractSpecificMatch(testCase);
      
      if (specificMatch) {
        console.log(`✅ Partida específica detectada:`);
        console.log(`   🏠 Home Team: ${specificMatch.homeTeam}`);
        console.log(`   🚌 Away Team: ${specificMatch.awayTeam}`);
      } else {
        console.log(`❌ Nenhuma partida específica detectada`);
      }
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
  
  // Testar extração direta de nomes de times
  console.log('🔍 Testando extração direta de nomes de times:');
  
  const teamTestCases = [
    'avai',
    'AVAÍ',
    'Avai',
    'AVAI',
    'leao da ilha',
    'leão da ilha',
    'avai fc',
    'avai futebol clube'
  ];

  for (const testCase of teamTestCases) {
    console.log(`\n📝 Testando: "${testCase}"`);
    
    try {
      const teamName = extractTeamName(testCase);
      console.log(`   🏟️ Time detectado: ${teamName || 'Nenhum'}`);
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
  
  // Testar a lógica de verificação de nomes
  console.log('🔍 Testando lógica de verificação de nomes:');
  
  const testNames = ['avai', 'AVAÍ', 'Avai', 'leao da ilha'];
  
  for (const testName of testNames) {
    const normalizedTestName = removeAccents(testName.toLowerCase());
    console.log(`\n📝 Testando: "${testName}" -> "${normalizedTestName}"`);
    
    // Verificar se existe na lista
    const exists = uniqueTeamNames.some(team => 
      team.toLowerCase().includes(normalizedTestName) || 
      normalizedTestName.includes(team.toLowerCase())
    );
    
    console.log(`   ✅ Existe na lista: ${exists}`);
    
    if (exists) {
      const foundTeam = uniqueTeamNames.find(team => 
        team.toLowerCase().includes(normalizedTestName) || 
        normalizedTestName.includes(team.toLowerCase())
      );
      console.log(`   🏟️ Time encontrado: ${foundTeam}`);
    }
  }
}

// Executar teste
testTeamNameDetection();
