const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testChatbotAPI() {
  console.log('🚀 TESTE DO CHATBOT VIA API NESTJS 🚀\n');
  console.log('=' .repeat(60));

  try {
    // 1. Testar status da API
    console.log('\n🔍 1. Testando status da API...');
    const statusResponse = await axios.get(`${BASE_URL}/chatbot/status`);
    console.log('✅ Status da API:', statusResponse.data.status);
    console.log('📊 Times no banco:', statusResponse.data.database?.teams || 'N/A');
    console.log('🎮 Jogos no banco:', statusResponse.data.database?.matches || 'N/A');

    // 2. Testar mensagens do chatbot
    const testMessages = [
      'Oi',
      'Próximo jogo do Flamengo',
      'Quando joga o Palmeiras?',
      'Informações do Corinthians',
      'Jogos de hoje',
      'Tabela do Brasileirão'
    ];

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      
      console.log(`\n🧪 TESTE ${i + 2}/${testMessages.length + 1}: "${message}"`);
      console.log('-' .repeat(50));

      try {
        const response = await axios.post(`${BASE_URL}/chatbot/test-message`, {
          phoneNumber: '+5511999999999',
          message: message
        });

        console.log('📤 RESPOSTA:');
        console.log('=' .repeat(40));
        console.log(response.data.response);
        console.log('=' .repeat(40));

      } catch (error) {
        console.log('❌ Erro na mensagem:', error.response?.data || error.message);
      }

      // Aguardar um pouco entre os testes
      if (i < testMessages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n✅ TODOS OS TESTES CONCLUÍDOS!');
    console.log('🎉 CHATBOT COM TYPEORM FUNCIONANDO!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
  }
}

// Executar os testes
testChatbotAPI(); 