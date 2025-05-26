const https = require('https');

// Configurar webhook com todos os eventos necessários para mensagens
const data = JSON.stringify({
  url: "https://2028-189-85-172-62.ngrok-free.app/chatbot/webhook",
  enabled: true,
  events: [
    "MESSAGES_UPSERT",    // ✅ Mensagens novas (principal)
    "MESSAGES_SET",       // ✅ Sincronização de mensagens
    "MESSAGES_UPDATE",    // ✅ Atualizações de status
    "CONNECTION_UPDATE",  // ✅ Status da conexão
    "CONTACTS_SET",       // 📱 Informações de contatos
    "PRESENCE_UPDATE"     // 👤 Status online/offline
  ]
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

console.log('🔧 Configurando webhook COMPLETO na Evolution API...');
console.log('📋 Eventos que serão ativados:');
console.log('   ✅ MESSAGES_UPSERT - Mensagens novas');
console.log('   ✅ MESSAGES_SET - Sincronização');
console.log('   ✅ MESSAGES_UPDATE - Status das mensagens');
console.log('   ✅ CONNECTION_UPDATE - Status da conexão');
console.log('   📱 CONTACTS_SET - Informações de contatos');
console.log('   👤 PRESENCE_UPDATE - Status online/offline');
console.log('');

const req = https.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  
  res.setEncoding('utf8');
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseData);
      console.log('📋 Resposta da Evolution API:', response);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ Webhook configurado com SUCESSO!');
        console.log('🎯 Agora TODAS as mensagens serão capturadas:');
        console.log('   📥 Mensagens recebidas (incoming)');
        console.log('   📤 Mensagens enviadas (outgoing)');
        console.log('   🔄 Atualizações de status');
        console.log('   📱 Informações de contatos');
        console.log('');
        console.log('🧪 Para testar, envie uma mensagem no WhatsApp!');
      } else {
        console.log('❌ Erro ao configurar webhook');
        console.log('📄 Resposta:', responseData);
      }
    } catch (e) {
      console.log('📄 Resposta raw:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro: ${e.message}`);
});

req.write(data);
req.end(); 