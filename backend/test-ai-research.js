/**
 * Script de teste para o sistema de respostas inteligentes
 * 
 * Como usar:
 * 1. Configure OPENAI_API_KEY no .env
 * 2. Execute: node test-ai-research.js
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';
const TEST_PHONE = 'test-ai-' + Date.now();

// Perguntas de teste para cada camada do sistema
const testCases = [
  {
    category: '📚 Base de Conhecimento Local',
    questions: [
      'Próximos jogos do Flamengo',
      'Onde vai passar Botafogo e Bragantino?',
      'Artilheiros do brasileirão',
      'Tabela de classificação',
    ]
  },
  {
    category: '🤖 OpenAI (Conhecimento Geral)',
    questions: [
      'Quantos mundiais o Palmeiras tem?',
      'Quem ganhou mais copas do mundo?',
      'Qual é a regra do impedimento?',
      'Quem foi Pelé?',
    ]
  },
  {
    category: '🌐 Pesquisa Web',
    questions: [
      'Últimas notícias sobre Neymar',
      'Quem é o técnico do Real Madrid?',
      'Quando foi fundado o Chelsea?',
    ]
  },
  {
    category: '🔀 Perguntas Diversas',
    questions: [
      'Oi',
      'Me ajuda com alguma coisa',
      'xyz123 teste aleatorio sem sentido',
    ]
  }
];

async function testQuestion(question, index, total) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${index}/${total}] Testando: "${question}"`);
  console.log('='.repeat(80));

  try {
    const response = await axios.post(
      `${BACKEND_URL}/chatbot/simulate-whatsapp`,
      {
        phoneNumber: TEST_PHONE,
        message: question,
        origin: 'site'
      },
      {
        timeout: 30000 // 30 segundos de timeout
      }
    );

    if (response.data.response) {
      console.log('\n✅ RESPOSTA RECEBIDA:');
      console.log('-'.repeat(80));
      console.log(response.data.response);
      console.log('-'.repeat(80));
    } else {
      console.log('\n⚠️ Resposta vazia ou erro');
      console.log(JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ ERRO ao testar pergunta:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Dados:', error.response.data);
    } else if (error.request) {
      console.error('Sem resposta do servidor. Backend está rodando?');
    } else {
      console.error('Erro:', error.message);
    }
  }
}

async function runTests() {
  console.log('\n🧪 TESTE DO SISTEMA DE RESPOSTAS INTELIGENTES');
  console.log('='.repeat(80));
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Telefone de teste: ${TEST_PHONE}`);
  console.log('='.repeat(80));

  // Verificar se backend está online
  try {
    await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend está online\n');
  } catch (error) {
    console.error('❌ Backend não está respondendo!');
    console.error('   Execute: npm run dev:backend');
    process.exit(1);
  }

  let totalQuestions = 0;
  testCases.forEach(category => {
    totalQuestions += category.questions.length;
  });

  let currentQuestion = 0;

  for (const category of testCases) {
    console.log('\n\n' + '█'.repeat(80));
    console.log(`  ${category.category}`);
    console.log('█'.repeat(80));

    for (const question of category.questions) {
      currentQuestion++;
      await testQuestion(question, currentQuestion, totalQuestions);
      
      // Aguardar 2 segundos entre perguntas para não sobrecarregar
      if (currentQuestion < totalQuestions) {
        console.log('\n⏳ Aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.log('\n\n' + '█'.repeat(80));
  console.log('  ✅ TESTES CONCLUÍDOS!');
  console.log('█'.repeat(80));
  console.log(`\nTotal de perguntas testadas: ${totalQuestions}`);
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('   1. Verifique se as respostas fazem sentido');
  console.log('   2. Observe qual camada respondeu cada pergunta');
  console.log('   3. Monitore os logs do backend para detalhes');
  console.log('   4. Acesse https://platform.openai.com/usage para ver custos\n');
}

// Executar testes
runTests().catch(error => {
  console.error('\n❌ Erro fatal nos testes:', error.message);
  process.exit(1);
});

