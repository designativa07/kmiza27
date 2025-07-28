const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testCreateMatch() {
  try {
    console.log('Testando criação de jogo amador...');
    
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
    
    const response = await fetch(`${API_URL}/amateur/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(matchData)
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Jogo criado com sucesso:', data);
    } else {
      const error = await response.text();
      console.error('Erro na criação:', error);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testCreateMatch(); 