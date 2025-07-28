const fetch = require('node-fetch');

async function testMatchUpdate() {
  try {
    console.log('Testando atualização de jogo amador...');
    
    const updateData = {
      competition_id: '23',
      home_team_id: '237',
      away_team_id: '238',
      stadium_id: null,
      match_date: '2024-08-15',
      home_score: 2,
      away_score: 1,
      status: 'finished'
    };

    console.log('Enviando requisição...');
    
    const response = await fetch('http://localhost:3000/amateur/matches/1453', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764'
      },
      body: JSON.stringify(updateData)
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Sucesso:', data);
    } else {
      const error = await response.text();
      console.error('Erro:', error);
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testMatchUpdate(); 