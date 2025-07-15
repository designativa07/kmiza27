const axios = require('axios');

const API_URL = 'http://localhost:3000'; // Ajustar se necessário

async function testWelcomeFlow() {
  console.log('🧪 TESTANDO NOVO FLUXO DE BOAS-VINDAS\n');

  const testCases = [
    {
      name: 'Primeira interação WhatsApp - Saudação',
      phone: '5511999998888',
      message: 'oi',
      origin: 'whatsapp',
      expected: 'Deve enviar mensagem de boas-vindas + menu'
    },
    {
      name: 'Segunda interação WhatsApp - Saudação',
      phone: '5511999998888',
      message: 'olá',
      origin: 'whatsapp',
      expected: 'Deve enviar mensagem de boas-vindas + menu novamente'
    },
    {
      name: 'Pergunta específica WhatsApp',
      phone: '5511999998888',
      message: 'próximo jogo Flamengo',
      origin: 'whatsapp',
      expected: 'Deve responder sobre o jogo + menu'
    },
    {
      name: 'Primeira interação Site',
      phone: 'site-user123',
      message: 'oi',
      origin: 'site',
      expected: 'Deve enviar mensagem de boas-vindas'
    },
    {
      name: 'Segunda interação Site - Saudação',
      phone: 'site-user123',
      message: 'olá',
      origin: 'site',
      expected: 'Deve enviar mensagem simples (não repetir boas-vindas)'
    },
    {
      name: 'Pergunta específica Site',
      phone: 'site-user123',
      message: 'jogos hoje',
      origin: 'site',
      expected: 'Deve responder sobre jogos (sem menu)'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Teste: ${testCase.name}`);
    console.log(`📱 Telefone: ${testCase.phone}`);
    console.log(`💬 Mensagem: "${testCase.message}"`);
    console.log(`🌐 Origem: ${testCase.origin}`);
    console.log(`🎯 Esperado: ${testCase.expected}`);
    
    try {
      const response = await axios.post(`${API_URL}/whatsapp/automation/process-message`, {
        phone: testCase.phone,
        message: testCase.message,
        userName: 'Teste User'
      });

      console.log(`✅ Sucesso: ${response.data.success}`);
      console.log(`🤖 Resposta: "${response.data.response?.substring(0, 100)}..."`);
    } catch (error) {
      console.log(`❌ Erro: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('─'.repeat(80));
    
    // Aguardar um pouco entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🏁 TESTES CONCLUÍDOS');
}

// Executar testes
if (require.main === module) {
  testWelcomeFlow().catch(console.error);
}

module.exports = { testWelcomeFlow }; 