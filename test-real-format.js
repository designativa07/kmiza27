const http = require('http');

const realPayload = {
  "event": "messages.upsert",
  "instance": "Kmiza27",
  "data": {
    "key": {
      "remoteJid": "554896652575@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0B82359CD7960644A00"
    },
    "pushName": "ToniMedeiros",
    "status": "DELIVERY_ACK",
    "message": {
      "conversation": "próximo jogo do flamengo"
    },
    "messageType": "conversation",
    "messageTimestamp": 1748141410,
    "instanceId": "2139c8da-b5b5-40e2-8cbb-44031d5bb6d9",
    "source": "web"
  },
  "destination": "https://2028-189-85-172-62.ngrok-free.app/chatbot/webhook",
  "date_time": "2025-05-24T23:50:10.277Z",
  "sender": "554896265397@s.whatsapp.net",
  "server_url": "https://kmiza27-evolution.h4xd66.easypanel.host",
  "apikey": "DEEFCBB25D74-4E46-BE91-CA7852798094"
};

const data = JSON.stringify(realPayload);

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

console.log('🧪 Testando webhook com formato REAL da Evolution API...');
console.log('📋 Payload:', JSON.stringify(realPayload, null, 2));

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
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
        
        if (parsed.success) {
          console.log(`🎉 SUCESSO! Mensagem processada:`);
          console.log(`   📱 Telefone: ${parsed.phoneNumber}`);
          console.log(`   💬 Mensagem: ${parsed.messageText}`);
          console.log(`   🤖 Resposta: ${parsed.response.substring(0, 100)}...`);
        }
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