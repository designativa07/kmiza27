const axios = require('axios')

async function testPredictionZero() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFudG9uaW8ubWVkZWlyb3NAZ21haWwuY29tIiwic3ViIjoxOSwiaXNfYWRtaW4iOnRydWUsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDQzMDg0OCwiZXhwIjoxNzU0NTE3MjQ4fQ.iQmZwME2_wXqjuS35Io2IBF9IiECLq0_zabpFz21AFE'
    
    console.log('🔍 Testando palpite com valor 0...')
    
    // Teste 1: Palpite com 0 x 0
    const predictionData1 = {
      match_id: 877,
      predicted_home_score: 0,
      predicted_away_score: 0
    }
    
    console.log('📤 Enviando palpite 0 x 0:', predictionData1)
    const response1 = await axios.post('http://localhost:3000/pools/18/predictions', predictionData1, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    console.log('✅ Resposta 0 x 0:', response1.status, response1.data)
    
    // Teste 2: Palpite com 0 x 1
    const predictionData2 = {
      match_id: 877,
      predicted_home_score: 0,
      predicted_away_score: 1
    }
    
    console.log('📤 Enviando palpite 0 x 1:', predictionData2)
    const response2 = await axios.post('http://localhost:3000/pools/18/predictions', predictionData2, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    console.log('✅ Resposta 0 x 1:', response2.status, response2.data)
    
    // Verificar palpites salvos
    console.log('\n📋 Verificando palpites salvos...')
    const predictionsResponse = await axios.get('http://localhost:3000/pools/18/my-predictions', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('📋 Meus palpites:', predictionsResponse.data)
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message)
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Headers:', error.response.headers)
    }
  }
}

testPredictionZero() 