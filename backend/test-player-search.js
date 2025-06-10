const fetch = require('node-fetch');

async function testPlayerSearch() {
  try {
    console.log('🔍 Testando busca por jogador via API...');
    
    const testQueries = [
      'bruno henrique',
      'Bruno Henrique', 
      'BRUNO HENRIQUE',
      'bruno',
      'henrique'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testando query: "${query}"`);
      
      // Simular a busca como no ChatbotService
      const encodedQuery = encodeURIComponent(`%${query}%`);
      const url = `https://kmizabot.h4xd66.easypanel.host/players?search=${encodedQuery}`;
      
      console.log(`📡 URL: ${url}`);
      
      try {
        const response = await fetch(url);
        console.log(`📊 Status: ${response.status}`);
        
        if (response.ok) {
          const players = await response.json();
          console.log(`✅ Jogadores encontrados: ${players.length}`);
          players.forEach(player => {
            console.log(`  - ${player.name} (ID: ${player.id})`);
          });
        } else {
          console.log(`❌ Erro: ${response.statusText}`);
        }
      } catch (fetchError) {
        console.log(`❌ Erro na requisição: ${fetchError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testPlayerSearch(); 