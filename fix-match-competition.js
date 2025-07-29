const API_URL = 'http://localhost:3000';

async function fixMatchCompetition() {
  try {
    console.log('=== CORRIGINDO COMPETITION_ID DO MATCH ===');
    
    // Match ID from the test
    const matchId = 1487;
    const competitionId = 18;
    
    console.log(`Corrigindo match ${matchId} para competição ${competitionId}...`);
    
    const response = await fetch(`${API_URL}/amateur/matches/${matchId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        competition_id: competitionId
      })
    });
    
    if (response.ok) {
      console.log('✅ Match corrigido com sucesso!');
      
      // Verificar se foi corrigido
      const checkResponse = await fetch(`${API_URL}/amateur/matches/${matchId}`);
      if (checkResponse.ok) {
        const match = await checkResponse.json();
        console.log('Match após correção:', {
          id: match.id,
          competition_id: match.competition_id,
          competition: match.competition?.id,
          status: match.status,
          score: `${match.home_score} x ${match.away_score}`
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Erro ao corrigir match:', response.status, error);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixMatchCompetition(); 