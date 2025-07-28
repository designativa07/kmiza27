const axios = require('axios');

async function testGetMatch1477() {
  try {
    console.log('Testando busca do jogo 1477...');

    const response = await axios.get('http://localhost:3000/amateur/matches/1477', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status da resposta:', response.status);
    console.log('Jogo encontrado:', response.data);

  } catch (error) {
    console.error('Erro ao buscar jogo:', error.response?.status, error.response?.data);
  }
}

testGetMatch1477(); 