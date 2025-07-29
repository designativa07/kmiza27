// Script para testar o endpoint /amateur/players
const API_URL = 'http://localhost:3000'; // Ajuste conforme necessário

async function testAmateurPlayers() {
  try {
    console.log('🧪 Testando endpoint /amateur/players...');
    
    // 1. Testar GET /amateur/players
    console.log('\n1. Fazendo requisição GET /amateur/players...');
    const response = await fetch(`${API_URL}/amateur/players`);
    
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    if (response.ok) {
      const players = await response.json();
      console.log(`✅ Sucesso! Encontrados ${players.length} jogadores amadores`);
      
      if (players.length > 0) {
        console.log('\n📋 Exemplos de jogadores:');
        players.slice(0, 3).forEach(player => {
          console.log(`  - ${player.name} (ID: ${player.id}, Categoria: ${player.category})`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro ${response.status}: ${errorText}`);
    }
    
    // 2. Testar com headers diferentes
    console.log('\n2. Testando com diferentes headers...');
    
    const responseWithAuth = await fetch(`${API_URL}/amateur/players`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log(`Status com Auth: ${responseWithAuth.status}`);
    
    // 3. Testar outros endpoints para comparação
    console.log('\n3. Testando outros endpoints para comparação...');
    
    const competitionsResponse = await fetch(`${API_URL}/amateur/competitions`);
    console.log(`Status /amateur/competitions: ${competitionsResponse.status}`);
    
    const teamsResponse = await fetch(`${API_URL}/amateur/teams`);
    console.log(`Status /amateur/teams: ${teamsResponse.status}`);
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAmateurPlayers(); 