const https = require('https');

// URL local do backend (assumindo que está rodando na porta 3000)
const BACKEND_URL = "http://localhost:3000";

const data = JSON.stringify({
  webhook: {
    url: `${BACKEND_URL}/chatbot/webhook`,
    enabled: true,
    events: ["MESSAGES_UPSERT"]
  }
});

const options = {
  hostname: 'kmiza27-evolution.h4xd66.easypanel.host',
  port: 443,
  path: '/webhook/set/kmizabot', // Usando o nome da instância correto
  method: 'POST',
  headers: {
    'apikey': '95DC243F41B2-4858-B0F1-FF49D8C46A85', // API Key atualizada
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔧 Configurando webhook na Evolution API...');
console.log('📡 URL do webhook:', `${BACKEND_URL}/chatbot/webhook`);
console.log('🏷️ Instância:', 'kmizabot');

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
  res.setEncoding('utf8');
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('📋 Resposta:', responseData);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Webhook configurado com sucesso!');
      console.log('🤖 O robô agora responderá automaticamente às mensagens recebidas');
      console.log('📱 Teste enviando uma mensagem para o WhatsApp conectado');
    } else {
      console.log('❌ Erro ao configurar webhook');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro:', e.message);
});

req.write(data);
req.end(); 