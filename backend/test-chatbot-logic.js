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
    
    if (data.response.includes('Não há dados')) {
      console.log(`❌ AINDA COM PROBLEMA: ${data.response.substring(0, 200)}...`);
    } else {
      console.log(`✅ CORRIGIDO: ${data.response.substring(0, 300)}...`);
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

async function debugStandings() {
  console.log('\n🔍 DEBUG: Verificando API de classificação...');
  
  try {
    const response = await fetch(`${baseUrl}/standings`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Standings API Status: ${response.status}`);
      console.log(`📊 Dados retornados: ${JSON.stringify(data).substring(0, 200)}...`);
    } else {
      console.log(`⚠️ Standings API falhou: ${response.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Erro na API standings: ${error.message}`);
  }
}

async function debugGoals() {
  console.log('\n🔍 DEBUG: Verificando dados de gols...');
  
  try {
    const response = await fetch(`${baseUrl}/matches/top-scorers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`⚽ Top Scorers API Status: ${response.status}`);
      console.log(`⚽ Dados retornados: ${JSON.stringify(data).substring(0, 200)}...`);
    } else {
      console.log(`⚠️ Top Scorers API falhou: ${response.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Erro na API top scorers: ${error.message}`);
  }
}

async function main() {
  console.log('🎯 Testando CORREÇÃO DOS ARTILHEIROS...\n');
  
  await testMessage('artilheiros');
  await testMessage('artilheiros do brasileirao');
  await testMessage('goleadores');
}

main(); 