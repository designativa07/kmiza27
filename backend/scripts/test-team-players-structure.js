const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEAM_ID = 237; // ou 238, dependendo de qual você quer testar

async function testTeamPlayersStructure() {
  console.log('=== TESTE DA ESTRUTURA DOS DADOS DOS JOGADORES DO TIME ===\n');

  try {
    // 1. Buscar jogadores do time
    console.log('1. Buscando jogadores do time...');
    const response = await axios.get(`${API_URL}/amateur/teams/${TEAM_ID}/players`);
    
    console.log('Status da resposta:', response.status);
    console.log('Número de jogadores:', response.data.length);
    
    // 2. Mostrar estrutura dos dados
    console.log('\n2. Estrutura dos dados:');
    response.data.forEach((teamPlayer, index) => {
      console.log(`\nJogador ${index + 1}:`);
      console.log('  - Estrutura completa:', JSON.stringify(teamPlayer, null, 2));
      console.log('  - player_id:', teamPlayer.player_id);
      console.log('  - team_id:', teamPlayer.team_id);
      console.log('  - jersey_number:', teamPlayer.jersey_number);
      console.log('  - role:', teamPlayer.role);
      console.log('  - start_date:', teamPlayer.start_date);
      console.log('  - end_date:', teamPlayer.end_date);
      
      if (teamPlayer.player) {
        console.log('  - player.id:', teamPlayer.player.id);
        console.log('  - player.name:', teamPlayer.player.name);
        console.log('  - player.position:', teamPlayer.player.position);
        console.log('  - player.nationality:', teamPlayer.player.nationality);
        console.log('  - player.state:', teamPlayer.player.state);
        console.log('  - player.image_url:', teamPlayer.player.image_url);
      } else {
        console.log('  - player: null ou undefined');
      }
    });

    // 3. Testar extração dos dados dos jogadores
    console.log('\n3. Testando extração dos dados dos jogadores:');
    const extractedPlayers = response.data.map(teamPlayer => teamPlayer.player).filter(Boolean);
    console.log('Jogadores extraídos:', extractedPlayers.length);
    extractedPlayers.forEach((player, index) => {
      console.log(`  Jogador ${index + 1}: ${player.name} (ID: ${player.id})`);
    });

  } catch (error) {
    console.error('Erro:', error.response?.status, error.response?.data);
  }

  console.log('\n=== TESTE FINALIZADO ===');
}

testTeamPlayersStructure(); 