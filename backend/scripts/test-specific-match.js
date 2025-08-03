const axios = require('axios');

async function testSpecificMatch() {
  console.log('🧪 Testando próximo jogo específico do Flamengo...');
  
  try {
    const response = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: '5511999999999',
      message: 'próximo jogo flamengo',
      origin: 'whatsapp'
    });
    
    const result = response.data.response;
    
    console.log('\n📄 RESPOSTA PRÓXIMO JOGO:');
    console.log(result);
    
    // Verificar se contém transmissão
    if (result.includes('📺') && result.includes('Onde assistir:')) {
      console.log('\n✅ Transmissões encontradas na resposta!');
    } else {
      console.log('\n❌ Transmissões NÃO encontradas na resposta');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testSpecificMatch();