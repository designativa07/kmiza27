const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testTeamsAPI() {
  try {
    console.log('Testando API de times amadores...');
    
    // Testar GET /amateur/teams
    console.log('\n1. Testando GET /amateur/teams');
    const teamsResponse = await fetch(`${API_URL}/amateur/teams`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Status:', teamsResponse.status);
    if (teamsResponse.ok) {
      const teams = await teamsResponse.json();
      console.log('Times encontrados:', teams.length);
      teams.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.name} (ID: ${team.id})`);
        console.log(`     Logo URL: ${team.logo_url || 'null'}`);
        console.log(`     Cidade: ${team.city || 'null'}`);
        console.log(`     Estado: ${team.state || 'null'}`);
      });
    } else {
      const error = await teamsResponse.text();
      console.error('Erro:', error);
    }
    
    // Testar GET /amateur/teams/238
    console.log('\n2. Testando GET /amateur/teams/238');
    const teamResponse = await fetch(`${API_URL}/amateur/teams/238`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Status:', teamResponse.status);
    if (teamResponse.ok) {
      const team = await teamResponse.json();
      console.log('Time:', team);
    } else {
      const error = await teamResponse.text();
      console.error('Erro:', error);
    }
    
    // Testar PATCH /amateur/teams/238
    console.log('\n3. Testando PATCH /amateur/teams/238');
    const updateResponse = await fetch(`${API_URL}/amateur/teams/238`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        name: 'Time dos Amigos',
        logo_url: 'https://exemplo.com/escudo.png'
      })
    });
    
    console.log('Status:', updateResponse.status);
    if (updateResponse.ok) {
      const updatedTeam = await updateResponse.json();
      console.log('Time atualizado:', updatedTeam);
    } else {
      const error = await updateResponse.text();
      console.error('Erro:', error);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testTeamsAPI(); 