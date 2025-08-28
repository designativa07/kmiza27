// Script para simular exatamente o erro que está acontecendo
// São Paulo sendo confundido com São Raimundo-RR

function removeAccents(str) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function testSaoPauloErrorSimulation() {
  console.log('🧪 Simulando erro real: São Paulo → São Raimundo-RR...\n');

  // Simular dados de times como estão na base real
  const teams = [
    {
      name: 'São Paulo',
      short_name: 'SAO',
      slug: 'sao-paulo',
      aliases: ['sao paulo', 'spfc', 'são paulo futebol clube', 'tricolor paulista']
    },
    {
      name: 'São Raimundo-RR',
      short_name: 'SRR',
      slug: 'sao-raimundo-rr',
      aliases: ['sao raimundo', 'são raimundo', 'raimundo rr', 'raimundo-rr']
    },
    {
      name: 'Cruzeiro',
      short_name: 'CRU',
      slug: 'cruzeiro',
      aliases: ['cruzeiro ec', 'cruzeiro esporte clube', 'raposa']
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

  // Simular o método extractTeamName ATUAL (que pode ter o bug)
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

  // Simular o método extractSpecificMatch ATUAL (que pode ter o bug)
  function extractSpecificMatch(message) {
    const lowerMessage = removeAccents(message.toLowerCase());
    
    // Padrões para detectar partidas específicas
    const patterns = [
      /(\w+(?:\s+\w+)*)\s*(?:x|vs|versus)\s*(\w+(?:\s+\w+)*)/i,
      /(\w+(?:\s+\w+)*)\s+contra\s+(\w+(?:\s+\w+)*)/i,
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

  // Testar o caso problemático exato
  const problemMessage = 'onde passa cruzeiro e sao paulo?';
  console.log(`📝 Testando mensagem problemática: "${problemMessage}"`);
  
  // 1. Testar extração individual de nomes
  console.log('\n🔍 Testando extração individual de nomes:');
  const names = ['cruzeiro', 'sao paulo'];
  
  for (const name of names) {
    console.log(`\n📝 Verificando: "${name}"`);
    
    // Verificar se existe na lista
    const exists = uniqueTeamNames.some(team => 
      team.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(team.toLowerCase())
    );
    
    console.log(`   ✅ Existe na lista: ${exists}`);
    
    if (exists) {
      const foundTeam = uniqueTeamNames.find(team => 
        team.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(team.toLowerCase())
      );
      console.log(`   🏟️ Time encontrado: ${foundTeam}`);
      
      // Verificar se há conflitos
      const conflicts = uniqueTeamNames.filter(team => 
        team.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(team.toLowerCase())
      );
      
      if (conflicts.length > 1) {
        console.log(`   ⚠️ CONFLITO DETECTADO! Múltiplos matches:`);
        conflicts.forEach(conflict => console.log(`      - ${conflict}`));
      }
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
  
  // 2. Testar extração de partida específica
  console.log('🔍 Testando extração de partida específica:');
  
  try {
    const specificMatch = extractSpecificMatch(problemMessage);
    
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

  console.log('\n' + '='.repeat(60) + '\n');
  
  // 3. Simular o erro real
  console.log('🚨 SIMULANDO O ERRO REAL:');
  console.log('📝 Mensagem: "onde passa cruzeiro e sao paulo?"');
  
  // Simular o que pode estar acontecendo no sistema real
  const normalizedMessage = removeAccents(problemMessage.toLowerCase());
  console.log(`📝 Mensagem normalizada: "${normalizedMessage}"`);
  
  // Verificar se "sao paulo" está sendo confundido com "sao raimundo"
  const saoPauloMatches = uniqueTeamNames.filter(team => 
    team.toLowerCase().includes('sao paulo') || 
    'sao paulo'.includes(team.toLowerCase())
  );
  
  console.log(`\n🔍 Matches para "sao paulo":`);
  saoPauloMatches.forEach(match => {
    console.log(`   - ${match}`);
  });
  
  // Verificar se há algum conflito com "sao raimundo"
  const saoRaimundoMatches = uniqueTeamNames.filter(team => 
    team.toLowerCase().includes('sao raimundo') || 
    'sao raimundo'.includes(team.toLowerCase())
  );
  
  console.log(`\n🔍 Matches para "sao raimundo":`);
  saoRaimundoMatches.forEach(match => {
    console.log(`   - ${match}`);
  });
  
  // Verificar se há sobreposição
  const overlap = saoPauloMatches.filter(team => 
    saoRaimundoMatches.some(raimundo => 
      team.toLowerCase().includes(raimundo.toLowerCase()) || 
      raimundo.toLowerCase().includes(team.toLowerCase())
    )
  );
  
  if (overlap.length > 0) {
    console.log(`\n⚠️ SOBREPOSIÇÃO DETECTADA entre "sao paulo" e "sao raimundo":`);
    overlap.forEach(team => console.log(`   - ${team}`));
  } else {
    console.log(`\n✅ Nenhuma sobreposição entre "sao paulo" e "sao raimundo"`);
  }
}

// Executar teste
testSaoPauloErrorSimulation();
