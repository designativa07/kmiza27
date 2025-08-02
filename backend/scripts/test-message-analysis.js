const axios = require('axios');

async function testMessageAnalysis() {
  try {
    console.log('🔍 Testando análise de mensagem...\n');
    
    const testMessages = [
      'flamengo',
      'botafogo',
      'vasco',
      'próximo jogo do flamengo',
      'último jogo do botafogo',
      'informações do vasco'
    ];
    
    for (const message of testMessages) {
      try {
        console.log(`📝 Testando: "${message}"`);
        
        const response = await axios.post('http://localhost:3000/chatbot/test-message', {
          message: message,
          phoneNumber: '5511999999999'
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`✅ Resposta: ${response.data.response || response.data}`);
        console.log('');
      } catch (error) {
        console.log(`❌ Erro: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          console.log(`   Dados: ${JSON.stringify(error.response.data)}`);
        }
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testMessageAnalysis(); 