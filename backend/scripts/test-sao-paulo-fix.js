// Teste para verificar se a correção resolve o conflito entre São Paulo e São Raimundo-RR

function removeAccents(str) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function testSaoPauloFix() {
  console.log('🧪 Testando correção do conflito São Paulo vs São Raimundo-RR...\n');

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

  // NOVA IMPLEMENTAÇÃO CORRIGIDA do extractTeamName
  function extractTeamName(message) {
    const lowerMessage = message.toLowerCase();

    // Buscar diretamente nos nomes de times carregados do banco (incluindo aliases)
    // Ordenar por comprimento (maiores primeiro) para evitar conflitos
    const sortedTeamNames = uniqueTeamNames.sort((a, b) => b.length - a.length);
    
    // Primeiro, tentar encontrar matches exatos ou muito específicos
    for (const teamName of sortedTeamNames) {
      if (teamName.length > 3) { // Ignorar aliases muito curtos inicialmente
        let matched = false;
        
        // Para nomes longos, usar busca normal
        if (lowerMessage.includes(teamName.toLowerCase())) {
          matched = true;
        }
        
        if (matched) {
          return teamName;
        }
      }
    }
    
    // Se não encontrou matches específicos, tentar com aliases curtos
    // mas sendo mais restritivo para evitar conflitos
    for (const teamName of sortedTeamNames) {
      if (teamName.length <= 3) {
        // Para aliases curtos, usar word boundaries e verificar se não há conflitos
        const regex = new RegExp(`\\b${teamName}\\b`, 'i');
        if (regex.test(message)) {
          // Verificar se este alias curto não causa conflitos
          const conflictingTeams = uniqueTeamNames.filter(otherTeam => 
            otherTeam !== teamName && 
            (otherTeam.toLowerCase().includes(teamName.toLowerCase()) || 
             teamName.toLowerCase().includes(otherTeam.toLowerCase()))
          );
          
          // Se não há conflitos ou se este é o único match, usar
          if (conflictingTeams.length === 0) {
            return teamName;
          }
          
          // Se há conflitos, verificar se a mensagem contém mais contexto
          // para resolver o conflito
          const hasMoreContext = conflictingTeams.some(conflict => 
            lowerMessage.includes(conflict.toLowerCase())
          );
          
          if (hasMoreContext) {
            // Se há mais contexto, continuar procurando por matches mais específicos
            continue;
          }
        }
      }
    }
    
    return undefined;
  }

  // Testar casos problemáticos
  const testCases = [
    'sao paulo',
    'são paulo',
    'SAO PAULO',
    'São Paulo',
    'sao raimundo',
    'são raimundo',
    'SAO RAIMUNDO',
    'São Raimundo-RR',
    'onde passa cruzeiro e sao paulo?',
    'cruzeiro x sao paulo',
    'cruzeiro vs sao paulo'
  ];

  console.log('🔍 Testando extração de nomes individuais (CORRIGIDA):');
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testando: "${testCase}"`);
    
    try {
      const teamName = extractTeamName(testCase);
      console.log(`   🏟️ Time detectado: ${teamName || 'Nenhum'}`);
      
      if (teamName) {
        // Verificar se o match faz sentido
        if (testCase.toLowerCase().includes('sao paulo') && teamName.includes('raimundo')) {
          console.log(`   ❌ ERRO: São Paulo foi confundido com São Raimundo!`);
        } else if (testCase.toLowerCase().includes('sao raimundo') && teamName.includes('paulo')) {
          console.log(`   ❌ ERRO: São Raimundo foi confundido com São Paulo!`);
        } else {
          console.log(`   ✅ Match correto`);
        }
      }
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
  
  // Testar casos específicos que estavam falhando
  console.log('🔍 Testando casos específicos que estavam falhando:');
  
  const specificTestCases = [
    'onde passa cruzeiro e sao paulo?',
    'cruzeiro e sao paulo',
    'cruzeiro x sao paulo'
  ];

  for (const testCase of specificTestCases) {
    console.log(`\n📝 Testando: "${testCase}"`);
    
    // Extrair nomes individuais
    const names = ['cruzeiro', 'sao paulo'];
    
    for (const name of names) {
      console.log(`   🔍 Verificando: "${name}"`);
      
      // Verificar se existe na lista
      const exists = uniqueTeamNames.some(team => 
        team.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(team.toLowerCase())
      );
      
      console.log(`      ✅ Existe na lista: ${exists}`);
      
      if (exists) {
        const foundTeam = extractTeamName(name);
        console.log(`      🏟️ Time detectado: ${foundTeam || 'Nenhum'}`);
        
        // Verificar se há conflitos
        const conflicts = uniqueTeamNames.filter(team => 
          team.toLowerCase().includes(name.toLowerCase()) || 
          name.toLowerCase().includes(team.toLowerCase())
        );
        
        if (conflicts.length > 1) {
          console.log(`      ⚠️ CONFLITO DETECTADO! Múltiplos matches:`);
          conflicts.forEach(conflict => console.log(`         - ${conflict}`));
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
  
  // Verificar se a correção resolve o conflito específico
  console.log('🔍 Verificando se a correção resolve o conflito específico:');
  
  const saoPauloMessage = 'sao paulo';
  const saoRaimundoMessage = 'sao raimundo';
  
  console.log(`\n📝 Testando "${saoPauloMessage}":`);
  const saoPauloResult = extractTeamName(saoPauloMessage);
  console.log(`   🏟️ Resultado: ${saoPauloResult || 'Nenhum'}`);
  
  console.log(`\n📝 Testando "${saoRaimundoMessage}":`);
  const saoRaimundoResult = extractTeamName(saoRaimundoMessage);
  console.log(`   🏟️ Resultado: ${saoRaimundoResult || 'Nenhum'}`);
  
  // Verificar se não há confusão
  if (saoPauloResult && saoRaimundoResult) {
    if (saoPauloResult.includes('raimundo') || saoRaimundoResult.includes('paulo')) {
      console.log(`\n❌ ERRO: Ainda há confusão entre os times!`);
    } else {
      console.log(`\n✅ SUCESSO: Não há mais confusão entre os times!`);
    }
  } else {
    console.log(`\n⚠️ Um dos times não foi detectado`);
  }
}

// Executar teste
testSaoPauloFix();
