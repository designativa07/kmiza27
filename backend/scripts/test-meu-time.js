const axios = require('axios');

async function testMeuTime() {
  console.log('🧪 Testando funcionalidade "meu time"...');
  
  const phoneNumber = '5511999999999';
  
  try {
    // Primeiro definir o time favorito
    console.log('\n📱 Definindo Flamengo como time favorito...');
    
    await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber,
      message: 'CMD_DEFINIR_TIME_FAVORITO',
      origin: 'whatsapp'
    });
    
    await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber,
      message: 'Flamengo',
      origin: 'whatsapp'
    });
    
    // Testar as diferentes variações de "meu time"
    const testCases = [
      'meu time',
      'MEU TIME', 
      'time favorito',
      'meu time favorito',
      'favorito'
    ];
    
    for (const testMessage of testCases) {
      console.log(`\n📱 Testando: "${testMessage}"`);
      
      const response = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
        phoneNumber,
        message: testMessage,
        origin: 'whatsapp'
      });
      
      const result = response.data.response;
      
      if (result.includes('❤️ SEU TIME FAVORITO: Flamengo')) {
        console.log('✅ FUNCIONOU!');
        
        // Verificar se tem a dica correta
        if (result.includes('💡 Dica: Digite "MEU TIME" para receber esse resumo')) {
          console.log('✅ Dica correta encontrada!');
        } else {
          console.log('❌ Dica não encontrada ou incorreta');
        }
      } else {
        console.log('❌ NÃO FUNCIONOU');
        console.log('Resposta recebida:', result.substring(0, 200) + '...');
      }
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testMeuTime();