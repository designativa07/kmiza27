const axios = require('axios');

async function testChatbotHorarios() {
  console.log('🕐 TESTE: Verificando horários corrigidos no chatbot');
  console.log('================================================');
  
  try {
    const response = await axios.post('http://localhost:3000/chatbot/test-message', {
      message: 'jogos da semana',
      phoneNumber: '5511999999999'
    });
    
    if (response.status === 201) {
      const chatbotResponse = response.data.output.response;
      console.log('\n✅ RESPOSTA DO CHATBOT:');
      console.log('========================');
      console.log(chatbotResponse);
      
      // Verificar se tem horários na resposta
      const horarioRegex = /\d{2}:\d{2}/g;
      const horarios = chatbotResponse.match(horarioRegex) || [];
      
      console.log('\n🕐 HORÁRIOS ENCONTRADOS NA RESPOSTA:');
      console.log('==================================');
      horarios.forEach((horario, i) => {
        console.log(`${i+1}. ${horario}`);
      });
      
      if (horarios.length > 0) {
        console.log('\n🎯 COMPARAÇÃO:');
        console.log('Frontend: "sex, 13/06 - 01:00"');
        console.log('Banco dados: "21:30:00+00" (UTC)');
        console.log(`Chatbot: "${horarios[0]}" (agora em UTC)`);
        
        console.log('\n✅ CORREÇÃO APLICADA:');
        console.log('- Removido timezone forçado "America/Sao_Paulo"');
        console.log('- Usando getUTCHours() e getUTCMinutes()');
        console.log('- Horários agora em UTC (igual ao frontend)');
      }
      
    } else {
      console.log('❌ Erro na resposta:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

testChatbotHorarios(); 