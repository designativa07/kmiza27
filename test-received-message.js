const http = require('http');

// Simular uma mensagem recebida (não enviada por nós)
const receivedMessagePayload = {
  event: "messages.upsert",
  instance: "Kmiza27",
  data: {
    key: {
      remoteJid: "5521996652575@s.whatsapp.net",
      fromMe: false, // IMPORTANTE: false = mensagem recebida
      id: `received_${Date.now()}`
    },
    pushName: "ToniMedeiros",
    message: {
      conversation: "Oi, como está o Flamengo hoje?"
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    messageType: "conversation"
  }
};

const data = JSON.stringify(receivedMessagePayload);

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

console.log('🧪 Testando mensagem RECEBIDA (fromMe: false)...');
console.log('📱 Simulando:', receivedMessagePayload.data.message.conversation);

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  
  res.setEncoding('utf8');
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseData);
      console.log('✅ Resposta do webhook:', response);
      
      if (response.success) {
        console.log('🤖 Bot respondeu:', response.response);
        console.log('📞 Para número:', response.phoneNumber);
        
        // Agora testar se a mensagem aparece na interface
        setTimeout(() => {
          console.log('\n🔍 Testando se a mensagem aparece na interface...');
          testMessageInInterface();
        }, 2000);
      }
    } catch (e) {
      console.log('📄 Resposta raw:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro: ${e.message}`);
  console.log('⚠️ Certifique-se de que o backend está rodando na porta 3000');
});

req.write(data);
req.end();

function testMessageInInterface() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/whatsapp/conversations/5521996652575@s.whatsapp.net/messages',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Status busca mensagens: ${res.statusCode}`);
    
    res.setEncoding('utf8');
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const messages = JSON.parse(responseData);
        console.log(`📨 Total de mensagens encontradas: ${messages.length}`);
        
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          console.log('📝 Última mensagem:', {
            type: lastMessage.type,
            message: lastMessage.message,
            isBot: lastMessage.isBot,
            timestamp: lastMessage.timestamp
          });
          
          // Verificar se nossa mensagem de teste está lá
          const testMessage = messages.find(m => 
            m.message.includes('Oi, como está o Flamengo hoje?')
          );
          
          if (testMessage) {
            console.log('✅ Mensagem de teste encontrada!');
            console.log('📋 Detalhes:', {
              type: testMessage.type,
              isBot: testMessage.isBot,
              userName: testMessage.userName
            });
            
            if (testMessage.type === 'incoming') {
              console.log('🎉 SUCESSO: Mensagem recebida aparece corretamente como INCOMING!');
            } else {
              console.log('❌ PROBLEMA: Mensagem recebida aparece como OUTGOING (deveria ser INCOMING)');
            }
          } else {
            console.log('❌ Mensagem de teste não encontrada na lista');
          }
        } else {
          console.log('❌ Nenhuma mensagem encontrada');
        }
      } catch (e) {
        console.log('📄 Resposta raw:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Erro ao buscar mensagens: ${e.message}`);
  });

  req.end();
} 