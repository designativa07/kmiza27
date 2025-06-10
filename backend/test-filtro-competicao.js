// Teste do novo filtro de competições
console.log('🧪 TESTE DO NOVO FILTRO DE COMPETIÇÕES');
console.log('====================================');

// Simular competições disponíveis
const mockCompetitions = [
  { name: 'Brasileirão Série A' },
  { name: 'Brasileirão Série B' },
  { name: 'Copa Libertadores' },
  { name: 'Copa Sul-Americana' },
  { name: 'Copa do Brasil' },
  { name: 'Campeonato Paulista' }
];

// Função de filtro (copiada do código corrigido)
function filterByCompetition(competitions, competitionName) {
  const normalizedCompName = competitionName.toLowerCase();
  
  return competitions.filter(competition => {
    const compName = competition.name.toLowerCase();
    
    // Busca direta por nome
    if (compName.includes(normalizedCompName)) {
      return true;
    }
    
    // Mapeamentos específicos para melhor correspondência
    const searchMappings = [
      // Série B
      { search: ['série b', 'serie b'], comp: ['série b', 'serie b'] },
      // Série A / Brasileirão
      { search: ['brasileir', 'série a', 'serie a'], comp: ['brasileir'] },
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
}

// Casos de teste
const testCases = [
  'série b',
  'serie b',
  'brasileirao serie b',
  'brasileirão série b',
  'artilheiros série b',
  'artilheiros do brasileirao',
  'goleadores serie a',
  'libertadores',
  'copa do brasil',
  'sul-americana'
];

console.log('\n🔍 RESULTADOS DOS TESTES:');
console.log('========================');

testCases.forEach(searchTerm => {
  console.log(`\n📝 Busca: "${searchTerm}"`);
  const results = filterByCompetition(mockCompetitions, searchTerm);
  
  if (results.length > 0) {
    console.log(`✅ Encontrado(s): ${results.map(r => r.name).join(', ')}`);
  } else {
    console.log(`❌ Nenhuma competição encontrada`);
  }
});

console.log('\n🎯 RESULTADO ESPERADO PARA "série b":');
console.log('Deveria encontrar: "Brasileirão Série B"');

const serieBResult = filterByCompetition(mockCompetitions, 'série b');
console.log(`✅ Resultado: ${serieBResult.map(r => r.name).join(', ') || 'Nenhum'}`);

console.log('\n🎯 RESULTADO ESPERADO PARA "artilheiros série b":');
console.log('Deveria encontrar: "Brasileirão Série B"');

const artilheirosSerieBResult = filterByCompetition(mockCompetitions, 'artilheiros série b');
console.log(`✅ Resultado: ${artilheirosSerieBResult.map(r => r.name).join(', ') || 'Nenhum'}`); 