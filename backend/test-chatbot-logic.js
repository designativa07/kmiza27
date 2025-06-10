const fetch = require('node-fetch');

const baseUrl = 'https://kmizabot.h4xd66.easypanel.host';

async function testMessage(message) {
  console.log(`\n🔍 Testando mensagem: "${message}"`);
  
  try {
    const response = await fetch(`${baseUrl}/chatbot/test-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message,
        phoneNumber: '5511999999999'
      })
    });
    
    console.log(`📊 Status: ${response.status}`);
    const data = await response.json();
    console.log(`✅ Resposta: ${data.response}`);
    
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  }
}

async function debugExtraction(message) {
  console.log(`\n🐛 DEBUG: "${message}"`);
  
  try {
    const response = await fetch(`${baseUrl}/chatbot/debug-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`🎯 Análise:`, JSON.stringify(data.analysis, null, 2));
    } else {
      console.log(`⚠️ Endpoint debug não disponível (${response.status})`);
    }
    
  } catch (error) {
    console.error(`❌ Erro debug: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Testando lógica do chatbot...\n');
  
  const testMessages = [
    'jogador Bruno Henrique',
    'jogador bruno henrique',
    'informações do jogador Bruno Henrique',
    'info do jogador Bruno Henrique',
    'dados do jogador Bruno Henrique'
  ];
  
  for (const message of testMessages) {
    await debugExtraction(message);
    await testMessage(message);
  }
}

main(); 