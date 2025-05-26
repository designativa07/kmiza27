const http = require('http');

const payload = {
  data: {
    messages: [{
      key: { remoteJid: "5511999999999@s.whatsapp.net" },
      message: { conversation: "oi" }
    }]
  }
};

const data = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/chatbot/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testando webhook com formato Evolution API...');
console.log('📋 Payload:', JSON.stringify(payload, null, 2));

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log(`📤 Resposta completa:`, responseData);
    
    if (responseData) {
      try {
        const parsed = JSON.parse(responseData);
        console.log(`✅ JSON parseado:`, parsed);
      } catch (e) {
        console.log(`⚠️  Não é JSON válido`);
      }
    } else {
      console.log(`❌ Resposta vazia!`);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro:`, e.message);
});

req.setTimeout(10000, () => {
  console.log('⏰ Timeout - requisição demorou mais de 10 segundos');
  req.destroy();
});

req.write(data);
req.end(); 