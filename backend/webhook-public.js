const https = require('https');

// Para teste, vamos usar uma URL pública temporária
// Em produção, você deve usar ngrok ou um domínio real
const PUBLIC_URL = "https://webhook.site/unique-id"; // Substitua por sua URL

console.log('🌐 Configurando webhook com URL pública...');
console.log(`📍 URL do webhook: ${PUBLIC_URL}/chatbot/webhook`);

const data = JSON.stringify({
  url: `${PUBLIC_URL}/chatbot/webhook`,
  enabled: true,
  events: ["MESSAGES_UPSERT"]
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

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  res.setEncoding('utf8');
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Webhook configurado com sucesso!');
      console.log(`📱 Agora as mensagens do WhatsApp serão enviadas para: ${PUBLIC_URL}/chatbot/webhook`);
    } else {
      console.log('❌ Erro ao configurar webhook');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro: ${e.message}`);
});

req.write(data);
req.end(); 