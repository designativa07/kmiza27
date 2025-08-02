const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugFavoriteTeam() {
  console.log('🔍 Debugando funcionalidade de Time Favorito...\n');

  const testPhone = '5511999999999';

  try {
    // Teste simples: apenas definir o time
    console.log('1️⃣ Definindo Flamengo como time favorito...');
    const setTeamResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      phoneNumber: testPhone,
      message: 'CMD_DEFINIR_TIME_FAVORITO'
    });
    console.log('Resposta:', setTeamResponse.data.response);

    // Enviar nome do time
    console.log('\n2️⃣ Enviando nome do time...');
    const teamNameResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      phoneNumber: testPhone,
      message: 'Flamengo'
    });
    console.log('Resposta:', teamNameResponse.data.response);

    // Testar com debug mais detalhado
    console.log('\n3️⃣ Testando com debug detalhado...');
    const debugResponse = await axios.post(`${BASE_URL}/chatbot/debug-test`, {
      phoneNumber: testPhone,
      message: 'CMD_MEU_TIME_FAVORITO'
    });
    console.log('Debug completo:', JSON.stringify(debugResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Stack trace:', error.response.data.stack);
    }
  }
}

// Executar o debug
debugFavoriteTeam(); 