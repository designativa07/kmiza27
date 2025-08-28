// Teste simples para verificar correção do conflito São Paulo vs São Raimundo-RR

function removeAccents(str) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

// Simular dados de times
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
  }
];

// Simular carregamento de nomes
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

const uniqueTeamNames = [...new Set(teamNames)].sort((a, b) => b.length - a.length);

console.log('📋 Nomes carregados:', uniqueTeamNames);

// NOVA IMPLEMENTAÇÃO CORRIGIDA
function extractTeamName(message) {
  const lowerMessage = message.toLowerCase();
  const sortedTeamNames = uniqueTeamNames.sort((a, b) => b.length - a.length);
  
  // Primeiro, tentar matches específicos (mais longos)
  for (const teamName of sortedTeamNames) {
    if (teamName.length > 3) {
      if (lowerMessage.includes(teamName.toLowerCase())) {
        return teamName;
      }
    }
  }
  
  // Depois, tentar aliases curtos com verificação de conflitos
  for (const teamName of sortedTeamNames) {
    if (teamName.length <= 3) {
      const regex = new RegExp(`\\b${teamName}\\b`, 'i');
      if (regex.test(message)) {
        // Verificar se há conflitos
        const conflictingTeams = uniqueTeamNames.filter(otherTeam => 
          otherTeam !== teamName && 
          (otherTeam.toLowerCase().includes(teamName.toLowerCase()) || 
           teamName.toLowerCase().includes(otherTeam.toLowerCase()))
        );
        
        if (conflictingTeams.length === 0) {
          return teamName;
        }
        
        // Se há conflitos, verificar se há mais contexto
        const hasMoreContext = conflictingTeams.some(conflict => 
          lowerMessage.includes(conflict.toLowerCase())
        );
        
        if (hasMoreContext) {
          continue; // Continuar procurando matches mais específicos
        }
      }
    }
  }
  
  return undefined;
}

// Testar casos problemáticos
console.log('\n🧪 Testando correção:');
console.log('='.repeat(50));

const testCases = [
  'sao paulo',
  'sao raimundo',
  'onde passa cruzeiro e sao paulo?'
];

for (const testCase of testCases) {
  console.log(`\n📝 Testando: "${testCase}"`);
  const result = extractTeamName(testCase);
  console.log(`   🏟️ Resultado: ${result || 'Nenhum'}`);
  
  if (result) {
    if (testCase.includes('sao paulo') && result.includes('raimundo')) {
      console.log(`   ❌ ERRO: São Paulo confundido com São Raimundo!`);
    } else if (testCase.includes('sao raimundo') && result.includes('paulo')) {
      console.log(`   ❌ ERRO: São Raimundo confundido com São Paulo!`);
    } else {
      console.log(`   ✅ Match correto`);
    }
  }
}

console.log('\n' + '='.repeat(50));
console.log('✅ Teste concluído!');
