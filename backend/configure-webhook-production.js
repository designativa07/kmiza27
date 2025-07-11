const https = require('https');

console.log('🚀 CONFIGURANDO WEBHOOK PARA PRODUÇÃO');
console.log('🌐 Novo domínio: api.kmiza27.com');
console.log('📦 Projeto: kmiza27-chatbot');
console.log('🔗 GitHub: https://github.com/designativa07/kmiza27');

const data = JSON.stringify({
  webhook: {
    url: "https://api.kmiza27.com/chatbot/webhook",
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
    'apikey': '95DC243F41B2-4858-B0F1-FF49D8C46A85',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('📡 Configurando webhook para: https://api.kmiza27.com/chatbot/webhook');
console.log('🔧 Instância Evolution API: Kmiza27');

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
  res.setEncoding('utf8');
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('📋 Resposta completa:', responseData);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('');
      console.log('✅ WEBHOOK CONFIGURADO COM SUCESSO!');
      console.log('🎯 DETALHES DA CONFIGURAÇÃO:');
      console.log('- 🌐 URL: https://api.kmiza27.com/chatbot/webhook');
      console.log('- 🤖 Instância: Kmiza27');
      console.log('- 📱 Eventos: MESSAGES_UPSERT');
      console.log('- ✅ Status: Habilitado');
      console.log('');
      console.log('🚀 O chatbot agora deve responder às mensagens!');
      console.log('💬 Teste enviando uma mensagem pelo WhatsApp');
      console.log('');
      console.log('🔗 URLs do projeto:');
      console.log('- API: https://api.kmiza27.com');
      console.log('- Admin: https://admin.kmiza27.com');
      console.log('- Futepédia: https://futepedia.kmiza27.com');
    } else {
      console.log('');
      console.log('❌ ERRO AO CONFIGURAR WEBHOOK');
      console.log(`📊 Status HTTP: ${res.statusCode}`);
      console.log('🔍 Verifique:');
      console.log('- Se o domínio api.kmiza27.com está acessível');
      console.log('- Se o backend está rodando');
      console.log('- Se a API Key está correta');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
  console.log('🔍 Verifique sua conexão com a internet');
});

req.write(data);
req.end(); 