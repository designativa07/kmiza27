// Teste atualizado para verificar a lógica corrigida de detecção de nomes de times
// Este script testa a nova implementação do extractSpecificMatch

function removeAccents(str) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function testTeamNameDetection() {
  console.log('🧪 Testando lógica CORRIGIDA de detecção de nomes de times...\n');

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

  // Método auxiliar para verificar se um nome é válido (nova implementação)
  function isValidTeamName(teamName) {
    if (!teamName || teamName.trim().length < 2) return false;
    
    const normalizedTeamName = removeAccents(teamName.toLowerCase());
    
    return uniqueTeamNames.some(team => {
      const normalizedTeam = removeAccents(team.toLowerCase());
      return normalizedTeam.includes(normalizedTeamName) || 
             normalizedTeamName.includes(normalizedTeam);
    });
  }
  
  // Método auxiliar para encontrar o nome exato do time (nova implementação)
  function findTeamByName(teamName) {
    if (!teamName || teamName.trim().length < 2) return undefined;
    
    const normalizedTeamName = removeAccents(teamName.toLowerCase());
    
    return uniqueTeamNames.find(team => {
      const normalizedTeam = removeAccents(team.toLowerCase());
      return normalizedTeam.includes(normalizedTeamName) || 
             normalizedTeamName.includes(normalizedTeam);
    });
  }

  // Nova implementação corrigida do extractSpecificMatch
  function extractSpecificMatch(message) {
    const lowerMessage = removeAccents(message.toLowerCase());
    
    // Padrões para detectar partidas específicas - mais precisos
    const patterns = [
      // Padrão: "Time1 x Time2" ou "Time1 vs Time2" ou "Time1 versus Time2"
      /([a-záàâãéèêíìîóòôõúùûç\s]+?)\s*(?:x|vs|versus)\s+([a-záàâãéèêíìîóòôõúùûç\s]+?)(?:\s|$|[?!.,])/i,
      // Padrão: "Time1 contra Time2"
      /([a-záàâãéèêíìîóòôõúùûç\s]+?)\s+contra\s+([a-záàâãéèêíìîóòôõúùûç\s]+?)(?:\s|$|[?!.,])/i,
      // Padrão: "Time1 e Time2" (mais restritivo)
      /([a-záàâãéèêíìîóòôõúùûç\s]+?)\s+e\s+([a-záàâãéèêíìîóòôõúùûç\s]+?)(?:\s|$|[?!.,])/i
    ];
    
    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        let homeTeam = match[1].trim();
        let awayTeam = match[2].trim();
        
        // Limpar palavras de contexto comuns
        const contextWords = ['onde', 'assistir', 'transmissao', 'transmissão', 'canais', 'passa', 'como', 'ver', 'ver', 'o', 'a', 'de', 'da', 'do', 'em', 'para'];
        
        // Remover palavras de contexto do início e fim
        homeTeam = homeTeam.replace(new RegExp(`^(${contextWords.join('|')})\\s+`, 'i'), '').trim();
        awayTeam = awayTeam.replace(new RegExp(`\\s+(${contextWords.join('|')})$`, 'i'), '').trim();
        
        // Se ainda há palavras de contexto, tentar extrair apenas o nome do time
        if (homeTeam.split(' ').length > 3) {
          // Tentar encontrar o nome do time no final da string
          const words = homeTeam.split(' ');
          for (let i = words.length - 1; i >= 0; i--) {
            const candidate = words.slice(i).join(' ');
            if (isValidTeamName(candidate)) {
              homeTeam = candidate;
              break;
            }
          }
        }
        
        if (awayTeam.split(' ').length > 3) {
          // Tentar encontrar o nome do time no início da string
          const words = awayTeam.split(' ');
          for (let i = 0; i < words.length; i++) {
            const candidate = words.slice(0, i + 1).join(' ');
            if (isValidTeamName(candidate)) {
              awayTeam = candidate;
              break;
            }
          }
        }
        
        console.log(`🔍 DEBUG extractSpecificMatch: "${homeTeam}" vs "${awayTeam}"`);
        
        // Verificar se ambos os times existem na lista de times conhecidos
        const homeTeamExists = isValidTeamName(homeTeam);
        const awayTeamExists = isValidTeamName(awayTeam);
        
        if (homeTeamExists && awayTeamExists) {
          // Retornar os nomes exatos dos times encontrados
          const foundHomeTeam = findTeamByName(homeTeam);
          const foundAwayTeam = findTeamByName(awayTeam);
          
          return {
            homeTeam: foundHomeTeam,
            awayTeam: foundAwayTeam
          };
        }
      }
    }
    
    return undefined;
  }

  // Testar diferentes variações para Avaí (casos que falhavam antes)
  const testCases = [
    'Onde assistir Avaí x Bahia?',
    'Transmissão avai vs bahia',
    'Canais avai e bahia',
    'Onde passa avai x bahia',
    'Transmissão AVAÍ x BAHIA',
    'Canais Avai vs Bahia',
    'Onde assistir avai contra bahia',
    'Transmissão avai versus bahia',
    'Avaí x Bahia',
    'avai vs bahia',
    'AVAÍ vs BAHIA',
    'leão da ilha x tricolor'
  ];

  console.log('🔍 Testando detecção de partidas específicas (CORRIGIDA):');
  
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
  
  // Testar a lógica de verificação de nomes
  console.log('🔍 Testando lógica de verificação de nomes (CORRIGIDA):');
  
  const testNames = ['avai', 'AVAÍ', 'Avai', 'leao da ilha', 'leão da ilha'];
  
  for (const testName of testNames) {
    const normalizedTestName = removeAccents(testName.toLowerCase());
    console.log(`\n📝 Testando: "${testName}" -> "${normalizedTestName}"`);
    
    // Verificar se existe na lista
    const exists = isValidTeamName(testName);
    
    console.log(`   ✅ Existe na lista: ${exists}`);
    
    if (exists) {
      const foundTeam = findTeamByName(testName);
      console.log(`   🏟️ Time encontrado: ${foundTeam}`);
    }
  }
}

// Executar teste
testTeamNameDetection();
