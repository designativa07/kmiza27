const https = require('https');

// Configuração do webhook para PRODUÇÃO
const EVOLUTION_API_URL = 'kmiza27-evolution.h4xd66.easypanel.host';
const API_KEY = '95DC243F41B2-4858-B0F1-FF49D8C46A85';
const INSTANCE_NAME = 'kmizabot';
const PRODUCTION_BACKEND_URL = 'https://kmizabot.h4xd66.easypanel.host/chatbot/webhook';

async function configureWebhookProduction() {
  console.log('🚀 Configurando webhook para PRODUÇÃO...');
  console.log(`📡 Evolution API: https://${EVOLUTION_API_URL}`);
  console.log(`🤖 Instância: ${INSTANCE_NAME}`);
  console.log(`🌐 Backend URL: ${PRODUCTION_BACKEND_URL}\n`);

  const webhookData = {
    webhook: {
      url: PRODUCTION_BACKEND_URL,
      enabled: true,
      events: ['MESSAGES_UPSERT'],
      webhookByEvents: false,
      webhookBase64: false
    }
  };

  const data = JSON.stringify(webhookData);

  const options = {
    hostname: EVOLUTION_API_URL,
    port: 443,
    path: `/webhook/set/${INSTANCE_NAME}`,
    method: 'POST',
    headers: {
      'apikey': API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('🔧 Configurando webhook...');
  console.log('📋 Dados do webhook:', JSON.stringify(webhookData, null, 2));

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    res.setEncoding('utf8');
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('📋 Resposta da Evolution API:', responseData);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n✅ WEBHOOK CONFIGURADO COM SUCESSO!');
        console.log('🎉 O chatbot agora está ativo em produção!');
        console.log('');
        console.log('📱 Para testar:');
        console.log('1. Envie uma mensagem no WhatsApp para a instância kmizabot');
        console.log('2. O bot deve responder automaticamente');
        console.log('3. Verifique os logs no Easypanel');
        console.log('');
        console.log('🔍 Monitoramento:');
        console.log('- Backend Health: https://kmizabot.h4xd66.easypanel.host/health');
        console.log('- Frontend: https://kmizafront.h4xd66.easypanel.host');
        console.log('- Dashboard: Automação IA');
        
        // Fazer um teste automático
        setTimeout(() => {
          console.log('\n🧪 Fazendo teste automático...');
          testChatbotAfterWebhook();
        }, 2000);
      } else {
        console.log('❌ Erro ao configurar webhook');
        if (res.statusCode === 401) {
          console.log('🔑 Verifique se a API Key está correta');
        } else if (res.statusCode === 404) {
          console.log('🤖 Verifique se a instância existe e está ativa');
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

async function testChatbotAfterWebhook() {
  console.log('📱 Testando resposta do chatbot em produção...');
  
  const testPayload = {
    phoneNumber: '5511999999999',
    message: 'Oi',
    userName: 'Teste Automático'
  };

  const data = JSON.stringify(testPayload);

  const options = {
    hostname: 'kmizabot.h4xd66.easypanel.host',
    port: 443,
    path: '/chatbot/test/simulate-received-message',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    console.log(`📊 Status teste: ${res.statusCode}`);
    
    res.setEncoding('utf8');
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(responseData);
        if (response.success && response.botResponse) {
          console.log('✅ TESTE SUCESSO!');
          console.log(`🤖 Resposta do bot: "${response.botResponse}"`);
          console.log('\n🎯 CHATBOT ESTÁ FUNCIONANDO PERFEITAMENTE!');
        } else {
          console.log('❌ Erro no teste:', response);
        }
      } catch (e) {
        console.log('📄 Resposta raw do teste:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erro no teste:', e.message);
  });

  req.write(data);
  req.end();
}

// Executar configuração
configureWebhookProduction(); 