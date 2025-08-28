const axios = require('axios');

async function testJogosTransmissao() {
  console.log('🧪 Testando jogos com canais de transmissão...');
  
  try {
    // Teste 1: Jogos de hoje
    console.log('\n📅 Teste 1: "jogos hoje"');
    const response1 = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: '5511999999999',
      message: 'jogos hoje',
      origin: 'whatsapp'
    });
    
    console.log('\n📄 RESPOSTA JOGOS DE HOJE:');
    console.log(response1.data.response);
    
    // Verificar se contém canais de transmissão
    if (response1.data.response.includes('📺') || response1.data.response.includes('🔗')) {
      console.log('\n✅ Canais de transmissão encontrados nos jogos de hoje!');
    } else {
      console.log('\n❌ Canais de transmissão NÃO encontrados nos jogos de hoje');
    }
    
    // Verificar se não contém informação de estádio
    if (response1.data.response.includes('🏟️')) {
      console.log('\n⚠️ Informação de estádio ainda presente nos jogos de hoje');
    } else {
      console.log('\n✅ Informação de estádio removida dos jogos de hoje');
    }
    
    // Teste 2: Jogos da semana
    console.log('\n📅 Teste 2: "jogos da semana"');
    const response2 = await axios.post('http://localhost:3000/chatbot/simulate-whatsapp', {
      phoneNumber: '5511999999999',
      message: 'jogos da semana',
      origin: 'whatsapp'
    });
    
    console.log('\n📄 RESPOSTA JOGOS DA SEMANA:');
    console.log(response2.data.response);
    
    // Verificar se contém canais de transmissão
    if (response2.data.response.includes('📺') || response2.data.response.includes('🔗')) {
      console.log('\n✅ Canais de transmissão encontrados nos jogos da semana!');
    } else {
      console.log('\n❌ Canais de transmissão NÃO encontrados nos jogos da semana');
    }
    
    // Verificar se não contém informação de estádio
    if (response2.data.response.includes('🏟️')) {
      console.log('\n⚠️ Informação de estádio ainda presente nos jogos da semana');
    } else {
      console.log('\n✅ Informação de estádio removida dos jogos da semana');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testJogosTransmissao();
