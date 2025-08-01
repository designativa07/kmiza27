const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '5511999999999';

async function testFavoriteTeamComplete() {
  console.log('🧪 Teste Completo da Funcionalidade de Time Favorito\n');

  try {
    // 1. Testar definição de time favorito
    console.log('1️⃣ Testando definição de time favorito...');
    const setResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      message: 'CMD_DEFINIR_TIME_FAVORITO',
      phoneNumber: TEST_PHONE
    });
    console.log('✅ Resposta:', typeof setResponse.data === 'string' ? setResponse.data.substring(0, 100) + '...' : JSON.stringify(setResponse.data).substring(0, 100) + '...');

    // 2. Simular resposta do usuário com nome do time
    console.log('\n2️⃣ Simulando resposta do usuário...');
    const teamResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      message: 'Flamengo',
      phoneNumber: TEST_PHONE
    });
    console.log('✅ Resposta:', typeof teamResponse.data === 'string' ? teamResponse.data.substring(0, 100) + '...' : JSON.stringify(teamResponse.data).substring(0, 100) + '...');

    // 3. Testar resumo do time favorito
    console.log('\n3️⃣ Testando resumo do time favorito...');
    const summaryResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      message: 'CMD_MEU_TIME_FAVORITO',
      phoneNumber: TEST_PHONE
    });
    console.log('✅ Resposta:', typeof summaryResponse.data === 'string' ? summaryResponse.data.substring(0, 100) + '...' : JSON.stringify(summaryResponse.data).substring(0, 100) + '...');

    // 4. Testar alteração de time favorito
    console.log('\n4️⃣ Testando alteração de time favorito...');
    const changeResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      message: 'CMD_ALTERAR_TIME_FAVORITO',
      phoneNumber: TEST_PHONE
    });
    console.log('✅ Resposta:', typeof changeResponse.data === 'string' ? changeResponse.data.substring(0, 100) + '...' : JSON.stringify(changeResponse.data).substring(0, 100) + '...');

    // 5. Simular nova resposta do usuário
    console.log('\n5️⃣ Simulando nova resposta do usuário...');
    const newTeamResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      message: 'Palmeiras',
      phoneNumber: TEST_PHONE
    });
    console.log('✅ Resposta:', typeof newTeamResponse.data === 'string' ? newTeamResponse.data.substring(0, 100) + '...' : JSON.stringify(newTeamResponse.data).substring(0, 100) + '...');

    // 6. Testar remoção de time favorito
    console.log('\n6️⃣ Testando remoção de time favorito...');
    const removeResponse = await axios.post(`${BASE_URL}/chatbot/test-message`, {
      message: 'CMD_REMOVER_TIME_FAVORITO',
      phoneNumber: TEST_PHONE
    });
    console.log('✅ Resposta:', typeof removeResponse.data === 'string' ? removeResponse.data.substring(0, 100) + '...' : JSON.stringify(removeResponse.data).substring(0, 100) + '...');

    console.log('\n🎉 Todos os testes completados com sucesso!');
    console.log('\n📱 Agora você pode usar no WhatsApp:');
    console.log('   - Digite "menu" para ver as opções');
    console.log('   - Procure pela seção "❤️ Meu Time Favorito"');
    console.log('   - Teste os comandos disponíveis');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
  }
}

// Executar testes
testFavoriteTeamComplete(); 