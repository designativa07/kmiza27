const axios = require('axios');

async function testAvaiSearch() {
  console.log('🧪 Testando busca do Avaí...');
  
  const tests = [
    'avaí',
    'Avaí', 
    'avai',
    'AVAI',
    'AVA'
  ];
  
  for (const teamName of tests) {
    try {
      console.log(`\n📱 Testando: "${teamName}"`);
      
      const response = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
        phoneNumber: '5511999999999',
        message: `info ${teamName}`,
        origin: 'whatsapp'
      });
      
      const result = response.data.response;
      
      if (result.includes('❌') && result.includes('não encontrado')) {
        console.log('❌ NÃO ENCONTRADO');
      } else if (result.includes('AVAÍ')) {
        console.log('✅ ENCONTRADO!');
      } else {
        console.log('🤔 Resposta inesperada:', result.substring(0, 100) + '...');
      }
      
    } catch (error) {
      console.error(`❌ Erro ao testar "${teamName}":`, error.message);
    }
  }
}

testAvaiSearch();