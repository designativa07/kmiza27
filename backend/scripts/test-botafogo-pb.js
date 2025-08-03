const axios = require('axios');

async function testBotafogoPB() {
  console.log('🧪 Testando busca específica para Botafogo-PB...');
  
  const tests = [
    'botafogo-pb',
    'Botafogo-PB', 
    'BOTAFOGO-PB',
    'botafogo pb',
    'info botafogo-pb',
    'próximo jogo botafogo-pb'
  ];
  
  for (const teamQuery of tests) {
    try {
      console.log(`\n📱 Testando: "${teamQuery}"`);
      
      const response = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
        phoneNumber: '5511999999999',
        message: teamQuery,
        origin: 'whatsapp'
      });
      
      const result = response.data.response;
      
      if (result.includes('Botafogo-PB')) {
        console.log('✅ ENCONTROU BOTAFOGO-PB!');
      } else if (result.includes('Botafogo') && !result.includes('Botafogo-PB')) {
        console.log('❌ ENCONTROU BOTAFOGO-RJ (ERRO!)');
        console.log('Resposta:', result.substring(0, 200) + '...');
      } else {
        console.log('🤔 Resposta inesperada');
        console.log('Resposta:', result.substring(0, 200) + '...');
      }
      
    } catch (error) {
      console.error(`❌ Erro ao testar "${teamQuery}":`, error.message);
    }
  }
  
  console.log('\n🎉 Teste concluído!');
}

testBotafogoPB();