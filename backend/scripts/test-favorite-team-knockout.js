const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testFavoriteTeamKnockout() {
  console.log('🧪 Testando funcionalidade de Time Favorito com competições de mata-mata...\n');

  const testPhone = '5511999999999';

  try {
    // 1. Definir Flamengo como time favorito
    console.log('1️⃣ Definindo Flamengo como time favorito...');
    const setTeamResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      phoneNumber: testPhone,
      message: 'CMD_DEFINIR_TIME_FAVORITO'
    });
    console.log('Resposta:', setTeamResponse.data.response);

    // 2. Enviar nome do time
    console.log('\n2️⃣ Enviando nome do time...');
    const teamNameResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      phoneNumber: testPhone,
      message: 'Flamengo'
    });
    console.log('Resposta:', teamNameResponse.data.response);

    // 3. Testar resumo do time favorito
    console.log('\n3️⃣ Testando resumo do time favorito...');
    const summaryResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      phoneNumber: testPhone,
      message: 'CMD_MEU_TIME_FAVORITO'
    });
    console.log('Resposta:', summaryResponse.data.response);

    // 4. Testar com outro time (Palmeiras)
    console.log('\n4️⃣ Testando com Palmeiras...');
    const changeTeamResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      phoneNumber: testPhone,
      message: 'CMD_ALTERAR_TIME_FAVORITO'
    });
    console.log('Resposta:', changeTeamResponse.data.response);

    const palmeirasResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      phoneNumber: testPhone,
      message: 'Palmeiras'
    });
    console.log('Resposta:', palmeirasResponse.data.response);

    const palmeirasSummaryResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      phoneNumber: testPhone,
      message: 'CMD_MEU_TIME_FAVORITO'
    });
    console.log('Resposta:', palmeirasSummaryResponse.data.response);

    console.log('\n✅ Teste concluído! Verifique as respostas acima para confirmar que:');
    console.log('   - Competições de pontos corridos mostram posição na tabela');
    console.log('   - Competições de mata-mata mostram fase atual + próxima partida');
    console.log('   - Não há informações de posição para competições de mata-mata');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
  }
}

// Executar o teste
testFavoriteTeamKnockout(); 