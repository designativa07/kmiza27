const http = require('http');

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

console.log('🧪 Testando chatbot...');
console.log('📱 Telefone:', '5521999999999');
console.log('💬 Mensagem:', 'Flamengo');

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