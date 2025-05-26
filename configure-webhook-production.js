const https = require('https');

// URL do VPS em produção - será definida após deploy no Easypanel/Hostinger
// Projeto: kmiza27-chatbot (https://github.com/designativa07/kmiza27)
const PRODUCTION_URL = process.env.PRODUCTION_URL || "https://kmiza27-backend.hostinger.com"; // Substitua pela URL real após deploy

const data = JSON.stringify({
  webhook: {
    url: `${PRODUCTION_URL}/chatbot/webhook`,
    enabled: true,
    events: ["MESSAGES_UPSERT"]
  }
});

const options = {
  hostname: 'kmiza27-evolution.h4xd66.easypanel.host',
  port: 443,
  path: '/webhook/set/kmizabot',
  method: 'POST',
  headers: {
    'apikey': '95DC243F41B2-4858-B0F1-FF49D8C46A85',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🚀 Configurando webhook para PRODUÇÃO...');
console.log('📦 Projeto: kmiza27-chatbot');
console.log('🔗 GitHub: https://github.com/designativa07/kmiza27');
console.log('📡 URL do webhook:', `${PRODUCTION_URL}/chatbot/webhook`);
console.log('🏷️ Instância Evolution API:', 'kmizabot');
console.log('🌐 Ambiente: PRODUÇÃO (VPS Hostinger + Easypanel)');

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
      console.log('✅ Webhook configurado para PRODUÇÃO!');
      console.log('🎉 Ngrok não é mais necessário!');
      console.log('🤖 O robô agora responde diretamente do VPS!');
      console.log('');
      console.log('🔍 Para verificar:');
      console.log('1. Envie uma mensagem no WhatsApp');
      console.log('2. Verifique os logs do VPS via Easypanel');
      console.log('3. O robô deve responder automaticamente');
      console.log('');
      console.log('📊 Configuração ativa:');
      console.log(`- Evolution API: kmiza27-evolution.h4xd66.easypanel.host`);
      console.log(`- Backend: ${PRODUCTION_URL}`);
      console.log(`- Instância: kmizabot`);
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