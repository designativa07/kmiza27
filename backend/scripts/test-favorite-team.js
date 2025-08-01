const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testFavoriteTeam() {
  console.log('🧪 Testando funcionalidade de Time Favorito...\n');

  const testPhone = '5511999999999';
  const testTeam = 'Flamengo';

  try {
    // 1. Testar definição de time favorito
    console.log('1️⃣ Testando definição de time favorito...');
    const setResponse = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: testPhone,
      message: 'CMD_DEFINIR_TIME_FAVORITO',
      origin: 'whatsapp'
    });
    console.log('Resposta:', setResponse.data.response);
    console.log('');

    // 2. Simular resposta com nome do time
    console.log('2️⃣ Simulando resposta com nome do time...');
    const teamResponse = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: testPhone,
      message: testTeam,
      origin: 'whatsapp'
    });
    console.log('Resposta:', teamResponse.data.response);
    console.log('');

    // 3. Testar resumo do time favorito
    console.log('3️⃣ Testando resumo do time favorito...');
    const summaryResponse = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: testPhone,
      message: 'CMD_MEU_TIME_FAVORITO',
      origin: 'whatsapp'
    });
    console.log('Resposta:', summaryResponse.data.response);
    console.log('');

    // 4. Testar alteração de time favorito
    console.log('4️⃣ Testando alteração de time favorito...');
    const changeResponse = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: testPhone,
      message: 'CMD_ALTERAR_TIME_FAVORITO',
      origin: 'whatsapp'
    });
    console.log('Resposta:', changeResponse.data.response);
    console.log('');

    // 5. Simular resposta com novo time
    console.log('5️⃣ Simulando resposta com novo time...');
    const newTeamResponse = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: testPhone,
      message: 'Palmeiras',
      origin: 'whatsapp'
    });
    console.log('Resposta:', newTeamResponse.data.response);
    console.log('');

    // 6. Testar remoção de time favorito
    console.log('6️⃣ Testando remoção de time favorito...');
    const removeResponse = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: testPhone,
      message: 'CMD_REMOVER_TIME_FAVORITO',
      origin: 'whatsapp'
    });
    console.log('Resposta:', removeResponse.data.response);
    console.log('');

    console.log('✅ Todos os testes concluídos!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
  }
}

// Executar testes
testFavoriteTeam(); 