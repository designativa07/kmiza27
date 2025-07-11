#!/usr/bin/env node

console.log('🔧 CORRIGINDO EVENTOS DO WEBHOOK (ANTI-LOOP)');
console.log('='.repeat(50));

const https = require('https');

// Configurações
const API_URL = 'evolution.kmiza27.com';
const API_KEY = '7C761B66EE97-498A-A058-E27A33A4AD78';
const INSTANCE_NAME = 'Kmiza27';

// ✅ APENAS EVENTOS SEGUROS (não causam loops)
const SAFE_EVENTS = [
  'MESSAGES_UPSERT'     // ✅ Apenas mensagens recebidas (entrada)
  // Removemos TODOS os outros eventos que podem causar loops:
  // - MESSAGES_SET/UPDATE (podem processar mensagens enviadas pelo bot)
  // - CHATS_*/CONTACTS_* (eventos de status que podem causar loops)
  // - CONNECTION_UPDATE/LOGOUT_INSTANCE (causam desconexões)
];

console.log('🎯 CONFIGURAÇÃO ANTI-LOOP:');
console.log('✅ Eventos habilitados:');
SAFE_EVENTS.forEach(event => {
  console.log(`   - ${event}`);
});

console.log('\n❌ Eventos removidos (causavam loops):');
const REMOVED_EVENTS = [
  'MESSAGES_SET',
  'MESSAGES_UPDATE', 
  'CHATS_SET',
  'CHATS_UPDATE',
  'CHATS_UPSERT',
  'CONTACTS_SET',
  'CONTACTS_UPDATE',
  'CONTACTS_UPSERT',
  'CONNECTION_UPDATE',
  'LOGOUT_INSTANCE',
  'TYPEBOT_START',
  'TYPEBOT_CHANGE_STATUS',
  'MESSAGES_RECEIPT_UPDATE',
  'PRESENCE_UPDATE',
  'QRCODE_UPDATED'
];

REMOVED_EVENTS.forEach(event => {
  console.log(`   - ${event}`);
});

async function fixWebhookEvents() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      webhook: {
        url: "https://api.kmiza27.com/chatbot/webhook",
        enabled: true,
        events: SAFE_EVENTS
      }
    });

    const options = {
      hostname: API_URL,
      port: 443,
      path: `/webhook/set/${INSTANCE_NAME}`,
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log('\n🔧 Aplicando configuração anti-loop...');
    console.log(`🌐 URL: https://${API_URL}/webhook/set/${INSTANCE_NAME}`);

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
          console.log('\n✅ WEBHOOK CONFIGURADO COM SUCESSO!');
          console.log('🛡️ PROTEÇÃO ANTI-LOOP ATIVADA');
          console.log('\n🎯 RESULTADO:');
          console.log('✅ Apenas MESSAGES_UPSERT habilitado');
          console.log('❌ Todos os eventos problemáticos removidos');
          console.log('🔒 Loop infinito deve estar resolvido');
          
          console.log('\n📋 PRÓXIMOS PASSOS:');
          console.log('1. ✅ Webhook configurado');
          console.log('2. 🔄 Aguarde alguns segundos');
          console.log('3. 💬 Teste enviando uma mensagem');
          console.log('4. 📊 Monitore os logs');
          
          resolve(responseData);
        } else {
          console.log('\n❌ ERRO AO CONFIGURAR WEBHOOK');
          console.log(`📊 Status HTTP: ${res.statusCode}`);
          console.log(`📄 Resposta: ${responseData}`);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro na requisição:', e.message);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Executar correção
fixWebhookEvents()
  .then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('🏁 CORREÇÃO CONCLUÍDA');
    console.log('\n🎉 O LOOP DEVE ESTAR RESOLVIDO!');
    console.log('\n🧪 TESTE AGORA:');
    console.log('- Envie uma mensagem pelo WhatsApp');
    console.log('- Verifique se o bot responde apenas uma vez');
    console.log('- Monitore os logs por alguns minutos');
    
    console.log('\n🚨 SE O LOOP PERSISTIR:');
    console.log('- Execute: node stop-bot-loop.js');
    console.log('- Verifique os logs do NestJS');
    console.log('- Pode ser problema no código do chatbot');
  })
  .catch(error => {
    console.error('\n❌ ERRO NA CORREÇÃO:', error.message);
    console.log('\n🔍 ALTERNATIVAS:');
    console.log('1. Verificar se API Key está correta');
    console.log('2. Verificar se instância existe');
    console.log('3. Desabilitar webhook temporariamente');
    console.log('4. Reiniciar serviço no Easypanel');
  }); 