const axios = require('axios');

async function testChatbot() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🤖 Testando chatbot com dados completos...\n');

  const testMessages = [
    'Oi',
    'Quando o Flamengo joga?',
    'Próximos jogos do Palmeiras',
    'Jogos de hoje',
    'Resultados da rodada 1',
    'Como foi Flamengo x Juventude?',
    'Tabela do brasileirão',
    'Próximos jogos do Vasco',
    'Onde assistir Palmeiras x Flamengo?'
  ];

  for (const message of testMessages) {
    try {
      console.log(`👤 Usuário: ${message}`);
      
      const response = await axios.post(`${baseURL}/chatbot/simulate-whatsapp`, {
        phoneNumber: '5511999999999',
        message: message
      });

      console.log(`🤖 Bot: ${response.data.response}\n`);
      
      // Aguardar um pouco entre as mensagens
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Erro ao testar mensagem "${message}":`, error.response?.data || error.message);
    }
  }
}

testChatbot().catch(console.error); 