#!/usr/bin/env node

/**
 * Script para debug da análise de mensagens do Barcelona
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugBarcelonaAnalysis() {
  console.log('🔍 Debugando análise de mensagens do Barcelona...\n');

  const testMessages = [
    'barca',
    'barça', 
    'barcelona',
    'posição do barcelona',
    'elenco do barca',
    'Barcelona-ESP'
  ];

  for (const message of testMessages) {
    console.log(`📝 Testando: "${message}"`);
    
    try {
      // Usar o endpoint de debug de análise
      const response = await axios.post(`${BASE_URL}/chatbot/debug-analysis`, {
        message: message
      });

      console.log(`🧠 Análise:`, response.data);
      console.log('─'.repeat(80));
    } catch (error) {
      console.error(`❌ Erro:`, error.response?.data || error.message);
      console.log('─'.repeat(80));
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  debugBarcelonaAnalysis().catch(console.error);
}

module.exports = { debugBarcelonaAnalysis };