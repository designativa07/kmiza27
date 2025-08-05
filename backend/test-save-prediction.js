const axios = require('axios');

async function testSavePrediction() {
  try {
    // Token de admin (Antonio Medeiros - ID 19)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFudG9uaW8ubWVkZWlyb3NAZ21haWwuY29tIiwic3ViIjoxOSwiaXNfYWRtaW4iOnRydWUsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDQzMDg0OCwiZXhwIjoxNzU0NTE3MjQ4fQ.iQmZwME2_wXqjuS35Io2IBF9IiECLq0_zabpFz21AFE';

    console.log('🔍 Testando salvamento de palpite...');

    // Dados do palpite
    const predictionData = {
      match_id: 863, // ID do primeiro jogo do bolão (Fortaleza vs Vélez Sarsfield)
      predicted_home_score: 2,
      predicted_away_score: 1
    };

    console.log('📤 Enviando palpite:', predictionData);

    const response = await axios.post('http://localhost:3000/pools/17/predictions', predictionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta do servidor:', response.status, response.data);

    // Verificar se o palpite foi salvo
    const predictionsResponse = await axios.get('http://localhost:3000/pools/17/my-predictions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📋 Meus palpites:', predictionsResponse.data);

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testSavePrediction(); 