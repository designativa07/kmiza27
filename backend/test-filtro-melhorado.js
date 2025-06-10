// Teste do filtro melhorado com priorização
console.log('🧪 TESTE DO FILTRO MELHORADO DE COMPETIÇÕES');
console.log('==========================================');

// Simular partidas com competições
const mockMatches = [
  { competition: { name: 'Brasileirão Série A' } },
  { competition: { name: 'Brasileirão Série A' } },
  { competition: { name: 'Brasileirão Série B' } },
  { competition: { name: 'Brasileirão Série B' } },
  { competition: { name: 'Copa Libertadores' } },
  { competition: { name: 'Copa Sul-Americana' } }
];

// Função de filtro melhorada (copiada do código corrigido)
function filterMatchesByCompetition(matches, competitionName) {
  const normalizedCompName = competitionName.toLowerCase();
  
  // Primeiro, tentar correspondência exata mais específica
  const exactMatches = matches.filter(match => {
    if (!match.competition) return false;
    const compName = match.competition.name.toLowerCase();
    
    // Prioridade para correspondências mais específicas
    if (normalizedCompName.includes('série b') || normalizedCompName.includes('serie b')) {
      return compName.includes('série b') || compName.includes('serie b');
    }
    
    if (normalizedCompName.includes('série a') || normalizedCompName.includes('serie a')) {
      return (compName.includes('série a') || compName.includes('serie a')) && 
             !(compName.includes('série b') || compName.includes('serie b'));
    }
    
    return false;
  });
  
  // Se encontrou correspondência específica, usar ela
  if (exactMatches.length > 0) {
    console.log(`🎯 Correspondência específica: ${exactMatches.length} partidas`);
    return exactMatches;
  } else {
    // Caso contrário, usar filtro genérico
    const genericMatches = matches.filter(match => {
      if (!match.competition) return false;
      const compName = match.competition.name.toLowerCase();
      
      // Busca direta por nome
      if (compName.includes(normalizedCompName)) {
        return true;
      }
      
      // Mapeamentos específicos para melhor correspondência
      const searchMappings = [
        // Brasileirão (genérico)
        { search: ['brasileir'], comp: ['brasileir'] },
        // Libertadores
        { search: ['libertador'], comp: ['libertador'] },
        // Copa do Brasil
        { search: ['copa do brasil', 'copa brasil'], comp: ['copa do brasil', 'copa brasil'] },
        // Sul-Americana
        { search: ['sul-americana', 'sulamericana'], comp: ['sul-americana', 'sulamericana'] }
      ];
      
      for (const mapping of searchMappings) {
        const searchMatches = mapping.search.some(term => normalizedCompName.includes(term));
        const compMatches = mapping.comp.some(term => compName.includes(term));
        if (searchMatches && compMatches) {
          return true;
        }
      }
      
      return false;
    });
    console.log(`🔍 Filtro genérico: ${genericMatches.length} partidas`);
    return genericMatches;
  }
}

// Casos de teste específicos
const testCases = [
  {
    search: 'série b',
    description: 'Deveria pegar APENAS Série B',
    expected: ['Brasileirão Série B']
  },
  {
    search: 'artilheiros série b',
    description: 'Deveria pegar APENAS Série B',
    expected: ['Brasileirão Série B']
  },
  {
    search: 'série a',
    description: 'Deveria pegar APENAS Série A',
    expected: ['Brasileirão Série A']
  },
  {
    search: 'brasileirao',
    description: 'Deveria pegar ambas as séries (filtro genérico)',
    expected: ['Brasileirão Série A', 'Brasileirão Série B']
  },
  {
    search: 'libertadores',
    description: 'Deveria pegar apenas Libertadores',
    expected: ['Copa Libertadores']
  }
];

console.log('\n🔍 RESULTADOS DOS TESTES:');
console.log('========================');

testCases.forEach(testCase => {
  console.log(`\n📝 Busca: "${testCase.search}"`);
  console.log(`💡 ${testCase.description}`);
  
  const results = filterMatchesByCompetition(mockMatches, testCase.search);
  const competitionNames = [...new Set(results.map(m => m.competition.name))];
  
  console.log(`✅ Encontrado: ${competitionNames.join(', ') || 'Nenhum'}`);
  console.log(`📊 Total de partidas: ${results.length}`);
  
  // Verificar se o resultado está correto
  const isCorrect = testCase.expected.every(exp => competitionNames.includes(exp)) &&
                   competitionNames.every(found => testCase.expected.includes(found));
  
  console.log(`${isCorrect ? '✅' : '❌'} Teste ${isCorrect ? 'PASSOU' : 'FALHOU'}`);
});

console.log('\n🎯 CONCLUSÃO:');
console.log('=============');
console.log('✅ "série b" agora retorna APENAS Série B');
console.log('✅ "série a" agora retorna APENAS Série A');
console.log('✅ "brasileirao" retorna ambas (comportamento esperado)'); 