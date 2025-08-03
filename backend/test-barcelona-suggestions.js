#!/usr/bin/env node

/**
 * Script de teste para verificar o sistema de sugestões do Barcelona
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBarcelonaSuggestions() {
  console.log('🧪 Testando sistema de sugestões para Barcelona...\n');

  const testCases = [
    { input: 'barca', description: 'Teste alias "barca"' },
    { input: 'barça', description: 'Teste alias "barça"' },
    { input: 'barcelona', description: 'Teste nome "barcelona"' },
    { input: 'posição do barcelona', description: 'Teste busca de posição' },
    { input: 'elenco do barca', description: 'Teste busca de elenco' }
  ];

  for (const testCase of testCases) {
    console.log(`📝 ${testCase.description}: "${testCase.input}"`);
    
    try {
      const response = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
        phoneNumber: `test-${Date.now()}`,
        message: testCase.input,
        origin: 'site'
      });

      console.log(`✅ Resposta:`, response.data.response);
      console.log('─'.repeat(80));
    } catch (error) {
      console.error(`❌ Erro:`, error.response?.data || error.message);
      console.log('─'.repeat(80));
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testBarcelonaSuggestions().catch(console.error);
}

module.exports = { testBarcelonaSuggestions };