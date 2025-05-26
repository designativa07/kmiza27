const https = require('https');

const EVOLUTION_CONFIG = {
  hostname: 'kmiza27-evolution.h4xd66.easypanel.host',
  apikey: 'DEEFCBB25D74-4E46-BE91-CA7852798094',
  instance: 'Kmiza27',
  webhookUrl: 'https://2028-189-85-172-62.ngrok-free.app/chatbot/webhook'
};

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: EVOLUTION_CONFIG.hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': EVOLUTION_CONFIG.apikey,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData, raw: responseData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData, raw: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function configureCompleteWebhook() {
  console.log('🔧 Configurando webhook completo para limpeza de cache...\n');

  try {
    // 1. Configurar webhook com TODOS os eventos necessários
    console.log('1️⃣ Configurando webhook com eventos completos...');
    const webhookConfig = {
      url: EVOLUTION_CONFIG.webhookUrl,
      enabled: true,
      events: [
        // Eventos principais de mensagens
        "MESSAGES_UPSERT",     // ✅ Mensagens novas
        "MESSAGES_UPDATE",     // ✅ Atualizações de mensagens
        "MESSAGES_DELETE",     // ✅ Mensagens deletadas
        "MESSAGES_SET",        // ✅ Sincronização de mensagens
        
        // Eventos de conversas
        "CHATS_SET",           // ✅ Sincronização de conversas
        "CHATS_UPDATE",        // ✅ Atualizações de conversas
        "CHATS_DELETE",        // ✅ Conversas deletadas
        "CHATS_UPSERT",        // ✅ Novas conversas
        
        // Eventos de conexão
        "CONNECTION_UPDATE",   // ✅ Status da conexão
        
        // Eventos de contatos
        "CONTACTS_SET",        // ✅ Sincronização de contatos
        "CONTACTS_UPDATE",     // ✅ Atualizações de contatos
        "CONTACTS_UPSERT",     // ✅ Novos contatos
        
        // Eventos de presença
        "PRESENCE_UPDATE",     // ✅ Status online/offline
        
        // Eventos de instância
        "INSTANCE_DELETE",     // ✅ Limpeza da instância
        "LOGOUT_INSTANCE"      // ✅ Logout da instância
      ]
    };

    const webhookResponse = await makeRequest(`/webhook/set/${EVOLUTION_CONFIG.instance}`, 'POST', webhookConfig);
    console.log(`   Resultado: ${webhookResponse.status}`);
    console.log(`   Detalhes:`, webhookResponse.data);
    console.log('');

    // 2. Verificar configuração atual
    console.log('2️⃣ Verificando configuração atual...');
    const statusResponse = await makeRequest(`/webhook/find/${EVOLUTION_CONFIG.instance}`);
    console.log(`   Status: ${statusResponse.status}`);
    console.log(`   Webhook:`, statusResponse.data);
    console.log('');

    // 3. Limpar cache da instância
    console.log('3️⃣ Limpando cache da instância...');
    const clearResponse = await makeRequest(`/instance/delete/${EVOLUTION_CONFIG.instance}`, 'DELETE');
    console.log(`   Resultado: ${clearResponse.status}`);
    console.log(`   Detalhes:`, clearResponse.data);
    console.log('');

    // 4. Aguardar um pouco
    console.log('4️⃣ Aguardando limpeza...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Recriar instância
    console.log('5️⃣ Recriando instância...');
    const createResponse = await makeRequest(`/instance/create`, 'POST', {
      instanceName: EVOLUTION_CONFIG.instance,
      token: EVOLUTION_CONFIG.apikey,
      qrcode: true,
      webhook: EVOLUTION_CONFIG.webhookUrl,
      webhook_by_events: true,
      events: webhookConfig.events
    });
    console.log(`   Resultado: ${createResponse.status}`);
    console.log(`   Detalhes:`, createResponse.data);
    console.log('');

    // 6. Conectar instância
    console.log('6️⃣ Conectando instância...');
    const connectResponse = await makeRequest(`/instance/connect/${EVOLUTION_CONFIG.instance}`, 'GET');
    console.log(`   Resultado: ${connectResponse.status}`);
    console.log(`   QR Code:`, connectResponse.data);

    console.log('\n✅ Configuração completa finalizada!');
    console.log('📱 Escaneie o QR Code para reconectar');
    console.log('🔄 O cache foi completamente limpo');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
  }
}

// Executar configuração
configureCompleteWebhook(); 