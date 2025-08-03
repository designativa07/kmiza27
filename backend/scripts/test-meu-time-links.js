const axios = require('axios');

async function testMeuTimeLinks() {
  console.log('🧪 Testando links na resposta do "meu time"...');
  
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
    
    // Testar "meu time"
    console.log('\n📱 Testando "meu time"...');
    
    const response = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber,
      message: 'meu time',
      origin: 'whatsapp'
    });
    
    const result = response.data.response;
    
    console.log('\n📄 RESPOSTA COMPLETA:');
    console.log(result);
    
    // Verificar se contém os links
    if (result.includes('🌐 LINKS PARA ASSISTIR e +INFO:')) {
      console.log('\n✅ Seção de links encontrada!');
      
      if (result.includes('📄 Página do time: https://futepedia.kmiza27.com/time/')) {
        console.log('✅ Link da página do time encontrado!');
      } else {
        console.log('❌ Link da página do time NÃO encontrado!');
      }
    } else {
      console.log('\n❌ Seção de links NÃO encontrada!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testMeuTimeLinks();