const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testFrontendPlayers() {
  console.log('=== TESTE DOS JOGADORES NO FRONTEND ===\n');

  try {
    // Simular as requisições que o frontend faz
    console.log('1. Testando requisições do frontend...');
    
    // Buscar jogadores do time 237 (Super Soccer)
    console.log('\nTime 237 (Super Soccer):');
    const homeResponse = await axios.get(`${API_URL}/amateur/teams/237/players`);
    const homePlayersData = homeResponse.data;
    const homePlayers = homePlayersData.map(teamPlayer => teamPlayer.player).filter(Boolean);
    console.log('  - Jogadores encontrados:', homePlayers.length);
    homePlayers.forEach(player => {
      console.log(`    * ${player.name} (${player.position})`);
    });

    // Buscar jogadores do time 238 (Time dos Amigos)
    console.log('\nTime 238 (Time dos Amigos):');
    const awayResponse = await axios.get(`${API_URL}/amateur/teams/238/players`);
    const awayPlayersData = awayResponse.data;
    const awayPlayers = awayPlayersData.map(teamPlayer => teamPlayer.player).filter(Boolean);
    console.log('  - Jogadores encontrados:', awayPlayers.length);
    awayPlayers.forEach(player => {
      console.log(`    * ${player.name} (${player.position})`);
    });

    console.log('\n=== CONCLUSÃO ===');
    if (homePlayers.length > 0 && awayPlayers.length > 0) {
      console.log('✅ Ambos os times têm jogadores!');
      console.log('✅ Os jogadores devem aparecer nos dropdowns do formulário.');
      console.log('\nPara testar:');
      console.log('1. Acesse: http://localhost:3001/admin-amadores/jogos/1505/editar');
      console.log('2. Clique em "Editar Gols"');
      console.log('3. Verifique se os jogadores aparecem nos dropdowns');
    } else {
      console.log('❌ Algum time não tem jogadores associados.');
      console.log('Primeiro adicione jogadores aos times em: http://localhost:3001/admin-amadores/times');
    }

  } catch (error) {
    console.error('Erro:', error.response?.status, error.response?.data);
  }

  console.log('\n=== TESTE FINALIZADO ===');
}

testFrontendPlayers(); 