const fetch = require('node-fetch');

// Configurações do backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function testChatbotLinks() {
  try {
    console.log('🧪 Testando integração dos links encurtados no chatbot...');
    console.log(`📡 Backend URL: ${BACKEND_URL}`);

    // Testar endpoint de jogos de hoje
    console.log('\n📅 Testando jogos de hoje...');
    const todayResponse = await fetch(`${BACKEND_URL}/chatbot/simulate-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: 'test-123',
        message: 'jogos hoje',
        origin: 'site'
      })
    });

    if (todayResponse.ok) {
      const todayData = await todayResponse.json();
      console.log('✅ Resposta de jogos de hoje:');
      console.log(todayData.response);
    } else {
      const errorText = await todayResponse.text();
      console.log(`❌ Erro ao testar jogos de hoje: ${todayResponse.status} - ${errorText}`);
    }

    // Testar endpoint de jogos da semana
    console.log('\n📅 Testando jogos da semana...');
    const weekResponse = await fetch(`${BACKEND_URL}/chatbot/simulate-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: 'test-456',
        message: 'jogos semana',
        origin: 'site'
      })
    });

    if (weekResponse.ok) {
      const weekData = await weekResponse.json();
      console.log('✅ Resposta de jogos da semana:');
      console.log(weekData.response);
    } else {
      const errorText = await weekResponse.text();
      console.log(`❌ Erro ao testar jogos da semana: ${weekResponse.status} - ${errorText}`);
    }

    // Testar comandos do menu
    console.log('\n🔘 Testando comandos do menu...');
    const menuCommands = [
      'CMD_JOGOS_HOJE',
      'CMD_JOGOS_SEMANA'
    ];

    for (const command of menuCommands) {
      try {
        const response = await fetch(`${BACKEND_URL}/chatbot/simulate-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: 'test-menu',
            message: command,
            origin: 'whatsapp'
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${command}:`);
          console.log(data.response);
        } else {
          const errorText = await response.text();
          console.log(`❌ ${command}: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ ${command}: ${error.message}`);
      }
    }

    console.log('\n🔗 Links encurtados serão gerados usando: link.kmiza27.com');

  } catch (error) {
    console.error('❌ Erro ao testar chatbot:', error);
  }
}

// Executar o script
testChatbotLinks(); 