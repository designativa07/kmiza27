const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'seu_token_aqui';

async function testMatchUpdate() {
  console.log('=== TESTE DE ATUALIZAÇÃO DE JOGO ===');
  
  try {
    // Primeiro, buscar um jogo existente
    console.log('\n1. Buscando jogos existentes...');
    const matchesResponse = await axios.get(`${API_URL}/amateur/matches`, {
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
    });
    
    if (matchesResponse.data.length === 0) {
      console.log('❌ Nenhum jogo encontrado para testar');
      return;
    }
    
    const matchId = matchesResponse.data[0].id;
    console.log('✅ Jogo encontrado com ID:', matchId);
    console.log('Jogo atual:', matchesResponse.data[0]);

    // Testar atualização
    console.log('\n2. Testando atualização...');
    const updateData = {
      status: 'finished',
      home_score: 2,
      away_score: 1
    };

    const updateResponse = await axios.patch(`${API_URL}/amateur/matches/${matchId}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    console.log('✅ Jogo atualizado com sucesso:', updateResponse.data);

  } catch (error) {
    console.error('❌ Erro:', error.response?.status, error.response?.data);
  }
}

testMatchUpdate(); 