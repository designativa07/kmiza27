const fetch = require('node-fetch');

async function testBrunoHenrique() {
  try {
    console.log('🔍 Testando busca por Bruno Henrique...');
    
    // Buscar todos os jogadores
    const playersResponse = await fetch('https://api.kmiza27.com/api/players');
    const players = await playersResponse.json();
    
    console.log('📊 Total de jogadores na base:', players.length);
    
    // Buscar Bruno Henrique especificamente
    const brunoHenriqueMatches = players.filter(player => 
      player.name.toLowerCase().includes('bruno henrique') ||
      player.name.toLowerCase().includes('bruno') && player.name.toLowerCase().includes('henrique')
    );
    
    console.log('🔍 Jogadores com "Bruno Henrique":');
    brunoHenriqueMatches.forEach(player => {
      console.log(`  - ID: ${player.id}, Nome: "${player.name}", Posição: ${player.position || 'N/A'}`);
    });
    
    if (brunoHenriqueMatches.length === 0) {
      console.log('❌ Bruno Henrique não encontrado na base de dados');
      
      // Buscar todos os "Bruno"
      const brunos = players.filter(player => 
        player.name.toLowerCase().includes('bruno')
      );
      
      console.log('🔍 Jogadores com "Bruno":');
      brunos.forEach(player => {
        console.log(`  - ID: ${player.id}, Nome: "${player.name}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testBrunoHenrique(); 