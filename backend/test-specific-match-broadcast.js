const axios = require('axios');

async function testSpecificMatchBroadcast() {
  console.log('🧪 Testando transmissão de partida específica...');
  
  try {
    // Teste 1: Pergunta sobre transmissão de partida específica
    console.log('\n📺 Teste 1: "Onde assistir Bahia x Fluminense?"');
    const response1 = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: '5511999999999',
      message: 'Onde assistir Bahia x Fluminense?',
      origin: 'whatsapp'
    });
    
    console.log('\n📄 RESPOSTA TRANSMISSÃO PARTIDA ESPECÍFICA:');
    console.log(response1.data.response);
    
    // Teste 2: Pergunta sobre transmissão de partida específica (formato alternativo)
    console.log('\n📺 Teste 2: "Canais Bahia vs Fluminense"');
    const response2 = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: '5511999999999',
      message: 'Canais Bahia vs Fluminense',
      origin: 'whatsapp'
    });
    
    console.log('\n📄 RESPOSTA FORMATO ALTERNATIVO:');
    console.log(response2.data.response);
    
    // Teste 3: Pergunta sobre transmissão de partida específica (formato "e")
    console.log('\n📺 Teste 3: "Transmissão Bahia e Fluminense"');
    const response3 = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: '5511999999999',
      message: 'Transmissão Bahia e Fluminense',
      origin: 'whatsapp'
    });
    
    console.log('\n📄 RESPOSTA FORMATO "E":');
    console.log(response3.data.response);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testSpecificMatchBroadcast();
