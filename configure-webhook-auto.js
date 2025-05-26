const https = require('https');

// Detectar ambiente automaticamente
const isProduction = process.env.NODE_ENV === 'production';

// URLs do projeto kmiza27-chatbot
const WEBHOOK_URL = isProduction 
  ? process.env.PRODUCTION_URL || "https://kmiza27-backend.hostinger.com"
  : "https://9d24-189-85-172-62.ngrok-free.app"; // URL atual do ngrok para desenvolvimento

const data = JSON.stringify({
  webhook: {
    url: `${WEBHOOK_URL}/chatbot/webhook`,
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

console.log('🔧 Configurando webhook automaticamente...');
console.log('📦 Projeto: kmiza27-chatbot');
console.log('🔗 GitHub: https://github.com/designativa07/kmiza27');
console.log('🌍 Ambiente:', isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
console.log('📡 URL do webhook:', `${WEBHOOK_URL}/chatbot/webhook`);
console.log('🏷️ Instância Evolution API:', 'kmizabot');

if (!isProduction) {
  console.log('⚠️ DESENVOLVIMENTO: Usando ngrok');
  console.log('💡 Para produção, defina NODE_ENV=production e PRODUCTION_URL');
  console.log('🔧 Comando: NODE_ENV=production PRODUCTION_URL=sua-url node configure-webhook-auto.js');
} else {
  console.log('🚀 PRODUÇÃO: Usando URL direta do VPS (Hostinger + Easypanel)');
  console.log('🎉 Ngrok não é necessário!');
}

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
      console.log('🤖 O robô está pronto para responder!');
      
      if (isProduction) {
        console.log('');
        console.log('🎯 PRODUÇÃO ATIVA:');
        console.log('- ✅ Webhook configurado para VPS');
        console.log('- ✅ Ngrok não é mais necessário');
        console.log('- ✅ Conexão direta e estável');
        console.log('- 🏗️ Deploy via Easypanel/Hostinger');
        console.log('- 📦 Código fonte: https://github.com/designativa07/kmiza27');
      } else {
        console.log('');
        console.log('🧪 DESENVOLVIMENTO ATIVO:');
        console.log('- ✅ Webhook configurado para ngrok');
        console.log('- ⚠️ Certifique-se que o ngrok está rodando');
        console.log('- 💡 Para produção: NODE_ENV=production');
        console.log('- 🔧 Repositório: https://github.com/designativa07/kmiza27');
      }
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