const https = require('https');
const http = require('http');

async function testChatbot() {
  console.log('🤖 Testando chatbot local...\n');

  const testMessages = [
    'Oi',
    'Próximo jogo do Flamengo',
    'Quando o Palmeiras joga?',
    'Jogos de hoje',
    'Tabela do brasileirão'
  ];

  for (const message of testMessages) {
    try {
      console.log(`👤 Usuário: "${message}"`);
      
      const payload = {
        phoneNumber: '5511999999999',
        message: message,
        userName: 'Usuario Teste'
      };

      const response = await makeRequest('localhost', 3000, '/chatbot/test/simulate-received-message', 'POST', payload);
      
      if (response.success) {
        console.log(`🤖 Bot: ${response.botResponse}\n`);
      } else {
        console.log(`❌ Erro: ${JSON.stringify(response)}\n`);
      }
      
      // Aguardar um pouco entre as mensagens
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Erro ao testar mensagem "${message}":`, error.message);
    }
  }
}

function makeRequest(hostname, port, path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve(jsonData);
        } catch (error) {
          resolve({ error: 'Invalid JSON', raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

testChatbot(); 