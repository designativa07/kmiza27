const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

async function testCreateMatchDebug() {
  try {
    console.log('=== DEBUG: Testando criação de jogo amador ===');
    
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

    console.log('1. Dados para criação:', matchData);
    console.log('2. URL da requisição:', `${API_URL}/amateur/matches`);
    console.log('3. Token:', TEST_TOKEN.substring(0, 50) + '...');
    
    const response = await fetch(`${API_URL}/amateur/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(matchData)
    });

    console.log('4. Status da resposta:', response.status);
    console.log('5. Headers da resposta:', response.headers.get('content-type'));
    
    if (response.ok) {
      const data = await response.json();
      console.log('6. Jogo criado com ID:', data.id);
      console.log('7. Dados do jogo criado:', data);
      
      // Verificar se o jogo foi criado corretamente no banco
      console.log('8. Verificando jogo no banco...');
      const checkResponse = await fetch(`${API_URL}/amateur/matches/${data.id}`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log('9. Verificação do jogo:', {
          id: checkData.id,
          home_team: checkData.home_team?.name || 'null',
          away_team: checkData.away_team?.name || 'null',
          competition: checkData.competition?.name || 'null'
        });
        
        // Verificar se há algum problema com o método getAmateurMatch
        console.log('10. Verificando se há logs no backend...');
        console.log('11. Se não há logs, significa que createAmateurMatch não está sendo chamado');
        console.log('12. Possível problema: outro controller ou método sendo chamado');
      } else {
        console.log('9. Erro ao verificar jogo:', checkResponse.status);
      }
    } else {
      const error = await response.text();
      console.log('6. Erro na criação:', error);
    }

    console.log('=== FIM DEBUG ===');

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testCreateMatchDebug(); 