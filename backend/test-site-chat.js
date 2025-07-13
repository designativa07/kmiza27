const axios = require('axios');

async function testSiteChat() {
  try {
    console.log('🧪 Testando chat do site...');
    
    const response = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: 'site-123456',
      message: 'oi',
      origin: 'site'
    });
    
    console.log('✅ Resposta recebida:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.response && response.data.response.includes('Ações Rápidas')) {
      console.log('✅ Menu de texto funcionando corretamente!');
    } else {
      console.log('❌ Menu de texto não encontrado na resposta');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Testar também com WhatsApp
async function testWhatsAppChat() {
  try {
    console.log('🧪 Testando chat do WhatsApp...');
    
    const response = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: '5511999999999',
      message: 'oi',
      origin: 'whatsapp'
    });
    
    console.log('✅ Resposta WhatsApp recebida:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro no teste WhatsApp:', error.response?.data || error.message);
  }
}

// Executar testes
testSiteChat().then(() => {
  console.log('\n' + '='.repeat(50) + '\n');
  return testWhatsAppChat();
}); 