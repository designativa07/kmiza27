const axios = require('axios');

async function testAvaiMessage() {
  console.log('🧪 Testando mensagem "avaí"...');
  
  try {
    const response = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: '554896652575',
      message: 'avaí',
      origin: 'whatsapp'
    });
    
    const result = response.data.response;
    
    console.log('\n📄 RESPOSTA PARA "avaí":');
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

testAvaiMessage();