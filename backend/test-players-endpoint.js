const fetch = require('node-fetch');

async function testPlayersEndpoint() {
  try {
    console.log('🔍 Testando endpoint de jogadores...');
    
    // Testar endpoint local
    const response = await fetch('http://localhost:3000/players');
    
    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error('Detalhes do erro:', errorText);
      return;
    }
    
    const players = await response.json();
    console.log(`✅ Sucesso! ${players.length} jogadores encontrados`);
    
    if (players.length > 0) {
      console.log('📋 Primeiro jogador:', JSON.stringify(players[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
  }
}

testPlayersEndpoint(); 