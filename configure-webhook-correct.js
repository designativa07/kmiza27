const https = require('https');

const data = JSON.stringify({
  webhook: {
    url: "https://2028-189-85-172-62.ngrok-free.app/chatbot/webhook",
    enabled: true,
    events: ["MESSAGES_UPSERT"]
  }
});

const options = {
  hostname: 'kmiza27-evolution.h4xd66.easypanel.host',
  port: 443,
  path: '/webhook/set/Kmiza27',
  method: 'POST',
  headers: {
    'apikey': 'DEEFCBB25D74-4E46-BE91-CA7852798094',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔧 Configurando webhook na Evolution API...');
console.log('📋 Payload:', data);

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
  res.setEncoding('utf8');
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('📋 Response:', responseData);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Webhook configurado com sucesso!');
      console.log('🌐 URL do Webhook: https://2028-189-85-172-62.ngrok-free.app/chatbot/webhook');
    } else {
      console.log('⚠️  Houve um problema na configuração. Verifique a resposta acima.');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.write(data);
req.end(); 