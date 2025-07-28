const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testGetMatches() {
  try {
    console.log('Testando busca de jogos amadores...');
    
    const response = await fetch(`${API_URL}/amateur/matches`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Jogos encontrados:', data.length);
      
      data.forEach((match, index) => {
        console.log(`\n--- Jogo ${index + 1} ---`);
        console.log(`ID: ${match.id}`);
        console.log(`Home Team: ${match.home_team?.name || 'N/A'} (ID: ${match.home_team?.id || 'N/A'})`);
        console.log(`Away Team: ${match.away_team?.name || 'N/A'} (ID: ${match.away_team?.id || 'N/A'})`);
        console.log(`Competition: ${match.competition?.name || 'N/A'} (ID: ${match.competition?.id || 'N/A'})`);
        console.log(`Score: ${match.home_score || '-'} x ${match.away_score || '-'}`);
        console.log(`Status: ${match.status}`);
        console.log(`Date: ${match.match_date}`);
      });
    } else {
      const error = await response.text();
      console.error('Erro na busca:', error);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testGetMatches(); 