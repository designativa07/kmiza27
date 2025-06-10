const axios = require('axios');

async function testSerieBReal() {
  console.log('🔍 TESTE REAL: Verificando Série B');
  console.log('================================');
  
  try {
    // Teste 1: Verificar artilheiros gerais (sem filtro)
    console.log('\n⚽ TESTE 1: Artilheiros gerais');
    const responseAll = await axios.post('http://localhost:3000/chatbot/test-message', {
      message: 'artilheiros',
      phoneNumber: '5511999999999'
    });
    
    if (responseAll.status === 201) {
      console.log('✅ Resposta artilheiros gerais:');
      console.log(responseAll.data.output.response);
    }
    
    // Teste 2: Verificar artilheiros da série B
    console.log('\n🏆 TESTE 2: Artilheiros da série B');
    const responseSB = await axios.post('http://localhost:3000/chatbot/test-message', {
      message: 'artilheiros da série b',
      phoneNumber: '5511999999999'
    });
    
    if (responseSB.status === 201) {
      console.log('✅ Resposta artilheiros série B:');
      console.log(responseSB.data.output.response);
    }
    
    // Teste 3: Verificar artilheiros do brasileirão
    console.log('\n🇧🇷 TESTE 3: Artilheiros do brasileirão');
    const responseBR = await axios.post('http://localhost:3000/chatbot/test-message', {
      message: 'artilheiros do brasileirão',
      phoneNumber: '5511999999999'
    });
    
    if (responseBR.status === 201) {
      console.log('✅ Resposta artilheiros brasileirão:');
      console.log(responseBR.data.output.response);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testSerieBReal(); 