const http = require('http');

// Função para testar se o servidor está rodando
function testServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/chatbot/simulate-whatsapp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    
    req.write(JSON.stringify({
      phoneNumber: 'site-123456',
      message: 'oi',
      origin: 'site'
    }));
    
    req.end();
  });
}

async function runTest() {
  try {
    console.log('🧪 Testando servidor...');
    const response = await testServer();
    console.log('✅ Resposta:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

runTest(); 