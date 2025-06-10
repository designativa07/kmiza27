const fetch = require('node-fetch');

const baseUrl = 'https://kmizabot.h4xd66.easypanel.host';

async function testMessage(message) {
  console.log(`\n🔍 Testando: "${message}"`);
  
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
    
    if (data.response.includes('não encontrado')) {
      console.log(`❌ FALHOU: ${data.response}`);
    } else {
      console.log(`✅ SUCESSO: ${data.response.substring(0, 100)}...`);
    }
    
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
  console.log('🔍 Testando variações do Avaí...\n');
  
  // Testes que estão falhando no WhatsApp
  const failingTests = [
    'avai',
    'informações do avai',
    'próximo jogo do avai',
    'proximo jogo do avai'
  ];
  
  // Testes que estão funcionando
  const workingTests = [
    'posição do avai',
    'posição do Avaí',
    'ultimo jogo do avai'
  ];
  
  console.log('❌ TESTES QUE ESTÃO FALHANDO:');
  for (const message of failingTests) {
    await testMessage(message);
  }
  
  console.log('\n✅ TESTES QUE FUNCIONAM:');
  for (const message of workingTests) {
    await testMessage(message);
  }
  
  console.log('\n🧪 TESTE BRUNO HENRIQUE:');
  await testMessage('jogador Bruno Henrique');
}

main(); 