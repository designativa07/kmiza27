#!/usr/bin/env node

console.log('🔍 VERIFICANDO EVENTOS DO WEBHOOK');
console.log('='.repeat(50));

const https = require('https');

// Configurações
const API_URL = 'evolution.kmiza27.com';
const API_KEY = '7C761B66EE97-498A-A058-E27A33A4AD78';
const INSTANCE_NAME = 'Kmiza27';

// Eventos que CAUSAM LOOPS (problemáticos)
const PROBLEMATIC_EVENTS = [
  'LOGOUT_INSTANCE',
  'CONNECTION_UPDATE', 
  'TYPEBOT_START',
  'TYPEBOT_CHANGE_STATUS',
  'MESSAGES_SET',      // ⚠️ Este pode estar causando o loop!
  'MESSAGES_UPDATE',   // ⚠️ Este também pode estar causando o loop!
  'MESSAGES_RECEIPT_UPDATE',
  'PRESENCE_UPDATE',
  'QRCODE_UPDATED',
  'CHATS_SET',         // ⚠️ Pode causar loops de status
  'CHATS_UPDATE',      // ⚠️ Pode causar loops de status
  'CONTACTS_SET',      // ⚠️ Pode causar loops de contatos
  'CONTACTS_UPDATE'    // ⚠️ Pode causar loops de contatos
];

// Eventos SEGUROS (apenas mensagens recebidas)
const SAFE_EVENTS = [
  'MESSAGES_UPSERT'    // ✅ Apenas este é necessário para chatbot
];

async function checkWebhookEvents() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL,
      port: 443,
      path: `/webhook/find/Kmiza27`,
      method: 'GET',
      headers: {
        'apikey': API_KEY,
      }
    };

    console.log('🔍 Verificando configuração atual do webhook...');
    console.log(`🌐 URL: https://${API_URL}/webhook/find/${INSTANCE_NAME}`);

    const req = https.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      
      res.setEncoding('utf8');
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          console.log('📋 Resposta completa:', JSON.stringify(data, null, 2));
          
          if (res.statusCode === 200 && data.webhook) {
            console.log('\n✅ WEBHOOK ENCONTRADO!');
            console.log(`🌐 URL: ${data.webhook.url}`);
            console.log(`🔄 Habilitado: ${data.webhook.enabled}`);
            console.log(`📅 Eventos configurados: ${data.webhook.events?.length || 0}`);
            
            if (data.webhook.events && Array.isArray(data.webhook.events)) {
              console.log('\n📋 EVENTOS ATUAIS:');
              data.webhook.events.forEach(event => {
                const isProblematic = PROBLEMATIC_EVENTS.includes(event);
                const isSafe = SAFE_EVENTS.includes(event);
                
                if (isProblematic) {
                  console.log(`❌ ${event} (PROBLEMÁTICO - pode causar loop)`);
                } else if (isSafe) {
                  console.log(`✅ ${event} (SEGURO)`);
                } else {
                  console.log(`⚠️ ${event} (DESCONHECIDO)`);
                }
              });
              
              // Analisar problemas
              const problematicFound = data.webhook.events.filter(event => 
                PROBLEMATIC_EVENTS.includes(event)
              );
              
              if (problematicFound.length > 0) {
                console.log('\n🚨 EVENTOS PROBLEMÁTICOS ENCONTRADOS:');
                problematicFound.forEach(event => {
                  console.log(`❌ ${event}`);
                });
                
                console.log('\n💡 ESTES EVENTOS PODEM ESTAR CAUSANDO O LOOP!');
                console.log('🔧 Recomendação: Execute fix-webhook-events.js');
              } else {
                console.log('\n✅ NENHUM EVENTO PROBLEMÁTICO ENCONTRADO');
                console.log('🤔 O loop pode ter outra causa...');
              }
              
              resolve(data);
            } else {
              console.log('\n⚠️ Nenhum evento configurado ou formato inválido');
              resolve(data);
            }
          } else {
            console.log('\n❌ ERRO AO VERIFICAR WEBHOOK');
            console.log(`📊 Status: ${res.statusCode}`);
            console.log(`📄 Resposta: ${responseData}`);
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          console.log('\n❌ ERRO AO PROCESSAR RESPOSTA');
          console.log(`📄 Resposta bruta: ${responseData}`);
          reject(error);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro na requisição:', e.message);
      reject(e);
    });

    req.end();
  });
}

// Executar verificação
checkWebhookEvents()
  .then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('🏁 VERIFICAÇÃO CONCLUÍDA');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Se encontrou eventos problemáticos: node fix-webhook-events.js');
    console.log('2. Se não encontrou: verificar logs do chatbot');
    console.log('3. Monitorar por alguns minutos');
  })
  .catch(error => {
    console.error('\n❌ ERRO NA VERIFICAÇÃO:', error.message);
    console.log('\n🔍 POSSÍVEIS CAUSAS:');
    console.log('- API Key incorreta');
    console.log('- Instância não existe');
    console.log('- Problemas de conectividade');
    console.log('- Evolution API fora do ar');
  }); 