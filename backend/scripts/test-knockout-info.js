const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testKnockoutInfo() {
  console.log('🧪 Testando funcionalidade de mata-mata...\n');

  try {
    // Testar com um time que participa de competições de mata-mata (ex: Flamengo)
    const testPhone = '5511999999999';
    
    console.log('📱 Definindo Flamengo como time favorito...');
    
    // Primeiro definir o time favorito
    const setFavoriteResponse = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: testPhone,
      message: 'CMD_DEFINIR_TIME_FAVORITO'
    });
    
    console.log('📋 Resposta do comando definir:', setFavoriteResponse.data.response);
    
    // Simular a resposta do usuário com o nome do time
    const setTeamResponse = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: testPhone,
      message: 'Flamengo'
    });
    
    console.log('📋 Resposta da definição:', setTeamResponse.data.response);
    
    console.log('📱 Testando resumo do time favorito...');
    
    const response = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: testPhone,
      message: 'CMD_MEU_TIME_FAVORITO'
    });

    console.log('✅ Resposta recebida:');
    console.log(response.data);
    
    // Verificar se a resposta contém informações de mata-mata
    const responseText = response.data.response || response.data;
    if (typeof responseText === 'string' && (responseText.includes('está na fase') || responseText.includes('próxima partida'))) {
      console.log('\n🎉 Funcionalidade de mata-mata funcionando corretamente!');
    } else {
      console.log('\n⚠️ Resposta não contém informações de mata-mata esperadas');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testKnockoutInfo(); 