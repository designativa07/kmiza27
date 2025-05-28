const https = require('https');

async function testChatbotWithRealFormat() {
  console.log('🧪 Testando chatbot com formato REAL da Evolution API...\n');

  // Simular payload real da Evolution API
  const realPayload = {
    "event": "messages.upsert",
    "instance": "kmizabot",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": `test_${Date.now()}`
      },
      "pushName": "Teste Automático",
      "message": {
        "conversation": "Oi"
      },
      "messageTimestamp": Math.floor(Date.now() / 1000),
      "messageType": "conversation"
    }
  };

  console.log('📱 Simulando mensagem real da Evolution API:');
  console.log(`👤 De: ${realPayload.data.pushName}`);
  console.log(`💬 Mensagem: "${realPayload.data.message.conversation}"`);
  console.log(`📞 Telefone: ${realPayload.data.key.remoteJid.replace('@s.whatsapp.net', '')}\n`);

  const data = JSON.stringify(realPayload);

  const options = {
    hostname: 'kmizabot.h4xd66.easypanel.host',
    port: 443,
    path: '/chatbot/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('🔗 Enviando para: https://kmizabot.h4xd66.easypanel.host/chatbot/webhook');

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    res.setEncoding('utf8');
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('📋 Resposta completa do webhook:', responseData);
      
      try {
        const response = JSON.parse(responseData);
        
        if (response.success) {
          console.log('\n✅ WEBHOOK FUNCIONOU!');
          console.log(`🤖 Bot processou a mensagem`);
          console.log(`📱 Para telefone: ${response.phoneNumber}`);
          console.log(`💬 Resposta: ${response.response}`);
          
          console.log('\n🎉 CHATBOT ESTÁ FUNCIONANDO PERFEITAMENTE!');
          console.log('🚀 Agora as mensagens reais do WhatsApp vão ser respondidas automaticamente!');
          
        } else if (response.ignored) {
          console.log('\n⚠️ Mensagem ignorada (provavelmente porque fromMe=true)');
          console.log(`📝 Razão: ${response.reason}`);
          
          // Testar com fromMe=false para garantir
          console.log('\n🔄 Testando novamente com fromMe=false...');
          setTimeout(() => testWithCorrectFromMe(), 1000);
          
        } else {
          console.log('\n❌ Erro na resposta:', response);
        }
        
      } catch (e) {
        console.log('\n📄 Resposta não é JSON válido:', responseData);
        if (res.statusCode === 200) {
          console.log('✅ Mas o status é 200, então pode estar funcionando!');
        }
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erro na requisição:', e.message);
  });

  req.write(data);
  req.end();
}

function testWithCorrectFromMe() {
  const correctedPayload = {
    "event": "messages.upsert",
    "instance": "kmizabot", 
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,  // Garantir que é false
        "id": `test_corrected_${Date.now()}`
      },
      "pushName": "Teste Corrigido",
      "message": {
        "conversation": "Próximo jogo do Flamengo"
      },
      "messageTimestamp": Math.floor(Date.now() / 1000),
      "messageType": "conversation"
    }
  };

  console.log('🔄 Testando com fromMe=false garantido...');
  console.log(`💬 Nova mensagem: "${correctedPayload.data.message.conversation}"`);

  const data = JSON.stringify(correctedPayload);

  const options = {
    hostname: 'kmizabot.h4xd66.easypanel.host',
    port: 443,
    path: '/chatbot/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    res.setEncoding('utf8');
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('📋 Resposta:', responseData);
      
      try {
        const response = JSON.parse(responseData);
        if (response.success) {
          console.log('\n🎯 PERFEITO! CHATBOT FUNCIONANDO!');
          console.log(`🤖 Resposta do bot: ${response.response}`);
        }
      } catch (e) {
        if (res.statusCode === 200) {
          console.log('✅ Status 200 - Chatbot funcionando!');
        }
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erro:', e.message);
  });

  req.write(data);
  req.end();
}

// Executar teste
testChatbotWithRealFormat(); 