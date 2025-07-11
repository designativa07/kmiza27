const https = require('https');

console.log('🔧 CONFIGURANDO EVENTOS CORRETOS DA EVOLUTION API');
console.log('📋 Eventos necessários: MESSAGES_UPSERT');
console.log('❌ Removendo eventos problemáticos: LOGOUT_INSTANCE, CONNECTION_UPDATE');

const data = JSON.stringify({
  webhook: {
    url: "https://api.kmiza27.com/chatbot/webhook",
    enabled: true,
    events: [
      "MESSAGES_UPSERT",
      "MESSAGES_SET",
      "MESSAGES_UPDATE",
      "CHATS_SET",
      "CHATS_UPDATE",
      "CHATS_UPSERT",
      "CONTACTS_SET",
      "CONTACTS_UPDATE",
      "CONTACTS_UPSERT"
    ]
  }
});

const options = {
  hostname: 'evolution.kmiza27.com',
  port: 443,
  path: '/webhook/set/Kmiza27',
  method: 'POST',
  headers: {
    'apikey': '7C761B66EE97-498A-A058-E27A33A4AD78',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('📡 Configurando webhook...');
console.log('🌐 URL: https://api.kmiza27.com/chatbot/webhook');
console.log('🤖 Instância: Kmiza27');

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
      console.log('🎯 EVENTOS CONFIGURADOS:');
      console.log('- ✅ MESSAGES_UPSERT (mensagens recebidas)');
      console.log('- ✅ MESSAGES_SET (mensagens definidas)');
      console.log('- ✅ MESSAGES_UPDATE (mensagens atualizadas)');
      console.log('- ✅ CHATS_* (conversas)');
      console.log('- ✅ CONTACTS_* (contatos)');
      console.log('');
      console.log('❌ EVENTOS REMOVIDOS (problemáticos):');
      console.log('- ❌ LOGOUT_INSTANCE (causava desconexões)');
      console.log('- ❌ CONNECTION_UPDATE (causava loops)');
      console.log('- ❌ TYPEBOT_* (interferência com bot)');
      console.log('');
      console.log('🚀 O chatbot agora deve funcionar estável!');
      console.log('💬 Teste enviando uma mensagem pelo WhatsApp');
    } else {
      console.log('');
      console.log('❌ ERRO AO CONFIGURAR WEBHOOK');
      console.log(`📊 Status HTTP: ${res.statusCode}`);
      console.log('🔍 Verifique:');
      console.log('- Se a API Key está correta');
      console.log('- Se a instância Kmiza27 existe');
      console.log('- Se a Evolution API está acessível');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
  console.log('🔍 Verifique sua conexão com a internet');
});

req.write(data);
req.end(); 