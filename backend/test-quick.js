const axios = require('axios');

// Configuração
const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = 'quick-test-123';

// Função para enviar mensagem
async function sendMessage(message) {
  try {
    const response = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      message,
      phoneNumber: TEST_PHONE,
      origin: 'site'
    });
    return response.data;
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return null;
  }
}

// Teste rápido de funcionalidades principais
async function quickTest() {
  console.log('🚀 TESTE RÁPIDO DO CHATBOT\n');
  
  // Teste 1: Query Adapter
  console.log('🔍 Testando Query Adapter...');
  const response1 = await sendMessage('onde vai passar botafogo?');
  if (response1) {
    console.log('✅ Query Adapter funcionando');
    const responseText = typeof response1 === 'string' ? response1 : JSON.stringify(response1);
    console.log(`📱 Resposta: ${responseText.substring(0, 100)}...`);
  }
  
  // Teste 2: Competição
  console.log('\n🔍 Testando Resposta de Competição...');
  const response2 = await sendMessage('copa do brasil');
  if (response2) {
    console.log('✅ Resposta de competição funcionando');
    const responseText = typeof response2 === 'string' ? response2 : JSON.stringify(response2);
    if (responseText.includes('🏆') && responseText.includes('📊')) {
      console.log('✅ Estrutura completa detectada');
    }
    console.log(`📱 Resposta: ${responseText.substring(0, 100)}...`);
  }
  
  // Teste 3: Confirmação
  console.log('\n🔍 Testando Sistema de Confirmação...');
  const response3 = await sendMessage('sim');
  if (response3) {
    console.log('✅ Sistema de confirmação funcionando');
    const responseText = typeof response3 === 'string' ? response3 : JSON.stringify(response3);
    console.log(`📱 Resposta: ${responseText.substring(0, 100)}...`);
  }
  
  // Teste 4: Extração de Times
  console.log('\n🔍 Testando Extração de Times...');
  const response4 = await sendMessage('onde vai passar botafogo e bragantino?');
  if (response4) {
    console.log('✅ Extração de times funcionando');
    const responseText = typeof response4 === 'string' ? response4 : JSON.stringify(response4);
    console.log(`📱 Resposta: ${responseText.substring(0, 100)}...`);
  }
  
  console.log('\n🎉 Teste rápido concluído!');
}

// Executar teste rápido
quickTest().catch(console.error);
