const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testAmateurAPI() {
  try {
    console.log('Testando API de competições amadoras...');
    
    // Testar GET /amateur/competitions
    console.log('\n1. Testando GET /amateur/competitions');
    const competitionsResponse = await fetch(`${API_URL}/amateur/competitions`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Status:', competitionsResponse.status);
    if (competitionsResponse.ok) {
      const competitions = await competitionsResponse.json();
      console.log('Competições encontradas:', competitions.length);
      competitions.forEach((comp, index) => {
        console.log(`  ${index + 1}. ${comp.name} (ID: ${comp.id})`);
        console.log(`     Logo URL: ${comp.logo_url || 'null'}`);
      });
    } else {
      const error = await competitionsResponse.text();
      console.error('Erro:', error);
    }
    
    // Testar GET /amateur/competitions/23
    console.log('\n2. Testando GET /amateur/competitions/23');
    const competitionResponse = await fetch(`${API_URL}/amateur/competitions/23`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Status:', competitionResponse.status);
    if (competitionResponse.ok) {
      const competition = await competitionResponse.json();
      console.log('Competição:', competition);
    } else {
      const error = await competitionResponse.text();
      console.error('Erro:', error);
    }
    
    // Testar PATCH /amateur/competitions/23
    console.log('\n3. Testando PATCH /amateur/competitions/23');
    const updateResponse = await fetch(`${API_URL}/amateur/competitions/23`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        name: 'Campeonato Municipal Atualizado',
        logo_url: 'https://exemplo.com/logo.png'
      })
    });
    
    console.log('Status:', updateResponse.status);
    if (updateResponse.ok) {
      const updatedCompetition = await updateResponse.json();
      console.log('Competição atualizada:', updatedCompetition);
    } else {
      const error = await updateResponse.text();
      console.error('Erro:', error);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testAmateurAPI(); 