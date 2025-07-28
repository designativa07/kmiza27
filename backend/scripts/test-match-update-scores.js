const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testMatchUpdateScores() {
  try {
    console.log('Testando atualização de scores do jogo amador...');
    
    const updateData = {
      competition_id: '23',
      home_team_id: '237',
      away_team_id: '238',
      stadium_id: null,
      match_date: '2024-08-15T20:00',
      home_score: 3,
      away_score: 2,
      status: 'finished'
    };

    console.log('Dados para atualização:', updateData);
    
    const response = await fetch(`${API_URL}/amateur/matches/1453`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(updateData)
    });

    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Jogo atualizado com sucesso:', data);
      console.log('Home Score:', data.home_score);
      console.log('Away Score:', data.away_score);
    } else {
      const error = await response.text();
      console.error('Erro na atualização:', error);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testMatchUpdateScores(); 