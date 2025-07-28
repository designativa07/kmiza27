const axios = require('axios');

async function testCreateMatchNoAuth() {
  try {
    console.log('Testando criação de jogo amador SEM autenticação...');

    const matchData = {
      home_team_id: 237,
      away_team_id: 238,
      competition_id: 23,
      stadium_id: null,
      match_date: '2024-08-20T19:00:00.000Z',
      status: 'scheduled',
      home_score: null,
      away_score: null
    };

    console.log('Dados para criação:', matchData);

    const response = await axios.post('http://localhost:3000/amateur/matches', matchData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status da resposta:', response.status);
    console.log('Jogo criado com sucesso:', response.data);

  } catch (error) {
    console.error('Erro ao criar jogo:', error.response?.status, error.response?.data);
  }
}

testCreateMatchNoAuth(); 