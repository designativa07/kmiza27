const axios = require('axios');

async function testBotafogoSpMessage() {
  console.log('🧪 Testando mensagem "botafogo-sp"...');
  
  try {
    const response = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: '554896652575',
      message: 'botafogo-sp',
      origin: 'whatsapp'
    });
    
    const result = response.data.response;
    
    console.log('\n📄 RESPOSTA PARA "botafogo-sp":');
    console.log(result);
    
    // Verificar se não há erro
    if (result.includes('❌')) {
      console.log('\n⚠️ Resposta contém erro');
    } else {
      console.log('\n✅ Resposta processada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testBotafogoSpMessage();