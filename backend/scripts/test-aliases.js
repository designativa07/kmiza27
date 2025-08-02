const axios = require('axios');

async function testAliases() {
  try {
    console.log('🔍 Testando aliases dos times...\n');
    
    const testAliases = [
      'fogão',
      'fogao',
      'estrela solitária',
      'estrela solitaria',
      'mengão',
      'mengao',
      'vascão',
      'vascao',
      'verdão',
      'verdao',
      'timão',
      'timao',
      'são paulo',
      'sao paulo'
    ];
    
    for (const alias of testAliases) {
      try {
        console.log(`📝 Testando alias: "${alias}"`);
        
        const response = await axios.post('http://localhost:3000/chatbot/test-message', {
          message: alias,
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

testAliases(); 