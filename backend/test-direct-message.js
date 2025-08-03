#!/usr/bin/env node

/**
 * Script para testar mensagens diretamente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDirectMessage() {
  console.log('🧪 Testando mensagens diretamente...\n');

  const tests = [
    { message: 'barca', expected: 'Deve encontrar Barcelona' },
    { message: 'posição do barca', expected: 'Deve retornar posição ou sugestões' },
    { message: 'Barcelona-ESP', expected: 'Deve encontrar Barcelona da Espanha' }
  ];

  for (const test of tests) {
    console.log(`📝 Teste: "${test.message}"`);
    console.log(`📋 Esperado: ${test.expected}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
        phoneNumber: `test-${Date.now()}`,
        message: test.message,
        origin: 'site'
      });

      console.log(`✅ Resposta completa:`);
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
  testDirectMessage().catch(console.error);
}

module.exports = { testDirectMessage };