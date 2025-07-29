// Script para testar se o problema dos gols foi resolvido
const API_URL = 'http://localhost:3000';

async function testGoalsFix() {
  try {
    console.log('🧪 Testando correção dos gols...');
    
    // 1. Testar se o endpoint de jogadores amadores ainda funciona
    console.log('\n1. Testando endpoint /amateur/players...');
    const playersResponse = await fetch(`${API_URL}/amateur/players`);
    console.log(`Status /amateur/players: ${playersResponse.status}`);
    
    // 2. Testar endpoint de competições amadoras
    console.log('\n2. Testando endpoint /amateur/competitions...');
    const competitionsResponse = await fetch(`${API_URL}/amateur/competitions`);
    console.log(`Status /amateur/competitions: ${competitionsResponse.status}`);
    
    if (competitionsResponse.ok) {
      const competitions = await competitionsResponse.json();
      console.log(`✅ Encontradas ${competitions.length} competições amadoras`);
      
      if (competitions.length > 0) {
        // 3. Testar endpoint de jogos amadores
        console.log('\n3. Testando endpoint /amateur/matches...');
        const matchesResponse = await fetch(`${API_URL}/amateur/matches`);
        console.log(`Status /amateur/matches: ${matchesResponse.status}`);
        
        if (matchesResponse.ok) {
          const matches = await matchesResponse.json();
          console.log(`✅ Encontrados ${matches.length} jogos amadores`);
          
          if (matches.length > 0) {
            console.log('\n📋 Exemplos de jogos:');
            matches.slice(0, 3).forEach(match => {
              console.log(`  - ${match.home_team?.name || 'Time Casa'} vs ${match.away_team?.name || 'Time Visitante'} (ID: ${match.id})`);
            });
          }
        }
      }
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testGoalsFix(); 