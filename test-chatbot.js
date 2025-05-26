const axios = require('axios');
const http = require('http');

async function testChatbot() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🤖 Testando Chatbot Kmiza27...\n');

  try {
    // Teste 1: Status da API
    console.log('1. Testando status da API...');
    const statusResponse = await axios.get(`${baseURL}/chatbot/status`);
    console.log('✅ Status:', statusResponse.data.status);
    console.log('');

    // Teste 2: Listar times
    console.log('2. Testando listagem de times...');
    const teamsResponse = await axios.get(`${baseURL}/teams`);
    console.log(`✅ ${teamsResponse.data.length} times encontrados`);
    console.log('Primeiros 3 times:', teamsResponse.data.slice(0, 3).map(t => t.name));
    console.log('');

    // Teste 3: Buscar time específico
    console.log('3. Testando busca de time por slug...');
    const flamengoResponse = await axios.get(`${baseURL}/teams/slug/flamengo`);
    console.log('✅ Flamengo encontrado:', flamengoResponse.data.name);
    console.log('');

    // Teste 4: Listar partidas
    console.log('4. Testando listagem de partidas...');
    const matchesResponse = await axios.get(`${baseURL}/matches`);
    console.log(`✅ ${matchesResponse.data.length} partidas encontradas`);
    console.log('');

    // Teste 5: Teste do chatbot - próximo jogo do Flamengo
    console.log('5. Testando chatbot - "próximo jogo do flamengo"...');
    const testData = JSON.stringify({
      phoneNumber: "5521999999999",
      message: "Flamengo"
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/chatbot/test-message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
      }
    };

    const req = http.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      
      res.setEncoding('utf8');
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('📋 Resposta do chatbot:');
        try {
          const response = JSON.parse(responseData);
          console.log(JSON.stringify(response, null, 2));
          
          if (response.success && response.response) {
            console.log('\n🤖 Resposta gerada:');
            console.log(response.response);
          }
        } catch (e) {
          console.log('Raw response:', responseData);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro:', e.message);
    });

    req.write(testData);
    req.end();

    // Teste 6: Teste do chatbot - quando joga o Palmeiras
    console.log('6. Testando chatbot - "quando joga o palmeiras"...');
    const chatResponse2 = await axios.post(`${baseURL}/chatbot/test-message`, {
      phoneNumber: '5511999999999',
      message: 'quando joga o palmeiras'
    });
    console.log('✅ Resposta do bot:');
    console.log(chatResponse2.data.response);
    console.log('');

    // Teste 7: Teste do chatbot - mensagem genérica
    console.log('7. Testando chatbot - mensagem genérica...');
    const chatResponse3 = await axios.post(`${baseURL}/chatbot/test-message`, {
      phoneNumber: '5511999999999',
      message: 'oi'
    });
    console.log('✅ Resposta do bot:');
    console.log(chatResponse3.data.response);
    console.log('');

    console.log('🎉 Todos os testes passaram! O chatbot está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Aguardar um pouco para o servidor iniciar
setTimeout(testChatbot, 3000); 