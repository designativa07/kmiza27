#!/usr/bin/env node

/**
 * Script para testar com usuário existente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testExistingUser() {
  console.log('🧪 Testando com usuário existente...\n');

  const phoneNumber = 'site-barcelona-test-user';
  
  // Primeiro, enviar uma saudação para "criar" o usuário
  console.log('👋 1. Enviando saudação inicial...');
  try {
    const firstResponse = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      phoneNumber: phoneNumber,
      message: 'oi',
      origin: 'site'
    });
    console.log('✅ Primeira resposta enviada\n');
  } catch (error) {
    console.error('❌ Erro na primeira mensagem:', error.response?.data || error.message);
  }

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Agora testar as mensagens do Barcelona
  const tests = [
    'barca',
    'posição do barca',
    'Barcelona-ESP'
  ];

  for (const message of tests) {
    console.log(`📝 Testando: "${message}"`);
    
    try {
      const response = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
        phoneNumber: phoneNumber,
        message: message,
        origin: 'site'
      });

      console.log(`✅ Resposta:`);
      console.log(response.data.response);
      console.log('─'.repeat(80));
    } catch (error) {
      console.error(`❌ Erro:`, error.response?.data || error.message);
      console.log('─'.repeat(80));
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testExistingUser().catch(console.error);
}

module.exports = { testExistingUser };