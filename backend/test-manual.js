const axios = require('axios');

// Configuração
const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = 'test-123456789';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 TESTANDO: ${name}`, 'cyan');
  log('='.repeat(50), 'cyan');
}

function logResult(success, message) {
  if (success) {
    log(`✅ ${message}`, 'green');
  } else {
    log(`❌ ${message}`, 'red');
  }
}

function logResponse(response) {
  log(`📱 Resposta:`, 'yellow');
  console.log(response);
}

// Função para enviar mensagem
async function sendMessage(message, origin = 'site') {
  try {
    const response = await axios.post(`${BASE_URL}/chatbot/simulate-whatsapp`, {
      message,
      phoneNumber: TEST_PHONE,
      origin
    });
    return response.data;
  } catch (error) {
    log(`❌ Erro na requisição: ${error.message}`, 'red');
    return null;
  }
}

// Teste 1: Query Adapter - Detecção de Intenções
async function testQueryAdapter() {
  logTest('QUERY ADAPTER - DETECÇÃO DE INTENÇÕES');
  
  const testCases = [
    {
      message: 'onde vai passar botafogo?',
      expectedIntent: 'broadcast_info',
      description: 'Detecção de pergunta sobre transmissão'
    },
    {
      message: 'copa do brasil',
      expectedIntent: 'competition_info',
      description: 'Detecção de competição'
    },
    {
      message: 'tabela de classificação',
      expectedIntent: 'table',
      description: 'Detecção de tabela'
    },
    {
      message: 'artilheiros',
      expectedIntent: 'top_scorers',
      description: 'Detecção de artilheiros'
    },
    {
      message: 'jogos de hoje',
      expectedIntent: 'matches_today',
      description: 'Detecção de jogos de hoje'
    }
  ];

  for (const testCase of testCases) {
    log(`\n🔍 Testando: "${testCase.message}"`, 'blue');
    const response = await sendMessage(testCase.message);
    
    if (response) {
      logResult(true, `Mensagem enviada com sucesso`);
      logResponse(response);
    } else {
      logResult(false, `Falha ao enviar mensagem`);
    }
  }
}

// Teste 2: Extração de Times
async function testTeamExtraction() {
  logTest('EXTRAÇÃO INTELIGENTE DE TIMES');
  
  const testCases = [
    {
      message: 'onde vai passar botafogo e bragantino?',
      expectedTeams: ['botafogo', 'bragantino'],
      description: 'Múltiplos times'
    },
    {
      message: 'onde vai passar o criciuma?',
      expectedTeams: ['criciuma'],
      description: 'Time único'
    },
    {
      message: 'qual canal vai passar santos x corinthians?',
      expectedTeams: ['santos', 'corinthians'],
      description: 'Times separados por "x"'
    },
    {
      message: 'em que canal passa o flamengo hoje?',
      expectedTeams: ['flamengo'],
      description: 'Time com palavras extras'
    }
  ];

  for (const testCase of testCases) {
    log(`\n🔍 Testando: "${testCase.message}"`, 'blue');
    const response = await sendMessage(testCase.message);
    
    if (response) {
      logResult(true, `Mensagem enviada com sucesso`);
      logResponse(response);
    } else {
      logResult(false, `Falha ao enviar mensagem`);
    }
  }
}

// Teste 3: Respostas de Competições
async function testCompetitionInfo() {
  logTest('RESPOSTAS COMPLETAS DE COMPETIÇÕES');
  
  const testCases = [
    {
      message: 'copa do brasil',
      description: 'Informações da Copa do Brasil'
    },
    {
      message: 'brasileirao',
      description: 'Informações do Brasileirão'
    },
    {
      message: 'libertadores',
      description: 'Informações da Libertadores'
    },
    {
      message: 'serie a',
      description: 'Informações da Série A'
    }
  ];

  for (const testCase of testCases) {
    log(`\n🔍 Testando: "${testCase.message}"`, 'blue');
    const response = await sendMessage(testCase.message);
    
    if (response) {
      logResult(true, `Mensagem enviada com sucesso`);
      logResponse(response);
      
      // Verificar se contém elementos esperados
      const responseText = typeof response === 'string' ? response : JSON.stringify(response);
      if (responseText.includes('🏆') && responseText.includes('📅') && responseText.includes('📊')) {
        logResult(true, `Resposta contém estrutura completa`);
      } else {
        logResult(false, `Resposta não contém estrutura completa`);
      }
    } else {
      logResult(false, `Falha ao enviar mensagem`);
    }
  }
}

// Teste 4: Sistema de Confirmações
async function testConfirmationSystem() {
  logTest('SISTEMA DE CONFIRMAÇÕES');
  
  log(`\n🔍 Testando fluxo: pergunta → resposta → confirmação`, 'blue');
  
  // Primeira mensagem: pergunta sobre competição
  log(`📤 Enviando: "copa do brasil"`, 'yellow');
  const response1 = await sendMessage('copa do brasil');
  
  if (response1) {
    logResult(true, `Primeira resposta recebida`);
    logResponse(response1);
    
    // Segunda mensagem: confirmação
    log(`\n📤 Enviando: "sim"`, 'yellow');
    const response2 = await sendMessage('sim');
    
    if (response2) {
      logResult(true, `Resposta de confirmação recebida`);
      logResponse(response2);
    } else {
      logResult(false, `Falha na resposta de confirmação`);
    }
  } else {
    logResult(false, `Falha na primeira resposta`);
  }
}

// Teste 5: Slugs e Links
async function testSlugSystem() {
  logTest('SISTEMA DE SLUGS E LINKS');
  
  const testCases = [
    'copa do brasil',
    'brasileirao',
    'libertadores'
  ];

  for (const testCase of testCases) {
    log(`\n🔍 Testando: "${testCase}"`, 'blue');
    const response = await sendMessage(testCase);
    
    if (response) {
      logResult(true, `Mensagem enviada com sucesso`);
      
      // Verificar se contém link com slug
      const responseText = typeof response === 'string' ? response : JSON.stringify(response);
      if (responseText.includes('http://localhost:3001/') && responseText.includes('/jogos')) {
        logResult(true, `Link com slug encontrado`);
        
        // Extrair o slug do link
        const slugMatch = responseText.match(/http:\/\/localhost:3001\/([^\/]+)\/jogos/);
        if (slugMatch) {
          log(`🔗 Slug extraído: ${slugMatch[1]}`, 'green');
        }
      } else {
        logResult(false, `Link com slug não encontrado`);
      }
      
      logResponse(response);
    } else {
      logResult(false, `Falha ao enviar mensagem`);
    }
  }
}

// Teste 6: Performance e Concorrência
async function testPerformance() {
  logTest('TESTE DE PERFORMANCE E CONCORRÊNCIA');
  
  log(`\n🔍 Testando 5 requisições simultâneas`, 'blue');
  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(sendMessage(`teste performance ${i}`));
  }
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logResult(true, `5 requisições completadas em ${duration}ms`);
    
    const successCount = results.filter(r => r !== null).length;
    logResult(successCount === 5, `${successCount}/5 requisições bem-sucedidas`);
    
  } catch (error) {
    logResult(false, `Erro no teste de performance: ${error.message}`);
  }
}

// Teste 7: Tratamento de Erros
async function testErrorHandling() {
  logTest('TRATAMENTO DE ERROS');
  
  const testCases = [
    {
      message: 'competicao inexistente 12345',
      description: 'Competição inexistente'
    },
    {
      message: 'onde vai passar time inexistente?',
      description: 'Time inexistente'
    },
    {
      message: 'tabela de competicao inexistente',
      description: 'Tabela de competição inexistente'
    }
  ];

  for (const testCase of testCases) {
    log(`\n🔍 Testando: "${testCase.message}"`, 'blue');
    const response = await sendMessage(testCase.message);
    
    if (response) {
      logResult(true, `Mensagem enviada com sucesso`);
      
      // Verificar se contém mensagem de erro apropriada
      const responseText = typeof response === 'string' ? response : JSON.stringify(response);
      if (responseText.includes('❌') || responseText.includes('não encontrada') || responseText.includes('não entendi')) {
        logResult(true, `Tratamento de erro apropriado`);
      } else {
        logResult(false, `Tratamento de erro não detectado`);
      }
      
      logResponse(response);
    } else {
      logResult(false, `Falha ao enviar mensagem`);
    }
  }
}

// Função principal
async function runAllTests() {
  log('🚀 INICIANDO TESTES COMPLETOS DO CHATBOT', 'bright');
  log('='.repeat(60), 'bright');
  
  try {
    // Verificar se o servidor está rodando
    log('\n🔍 Verificando conectividade com o servidor...', 'yellow');
    await axios.get(`${BASE_URL}/chatbot/status`);
    logResult(true, 'Servidor está rodando e acessível');
    
    // Executar todos os testes
    await testQueryAdapter();
    await testTeamExtraction();
    await testCompetitionInfo();
    await testConfirmationSystem();
    await testSlugSystem();
    await testPerformance();
    await testErrorHandling();
    
    log('\n🎉 TODOS OS TESTES FORAM EXECUTADOS!', 'bright');
    log('='.repeat(60), 'bright');
    
  } catch (error) {
    log('\n❌ ERRO CRÍTICO NOS TESTES', 'red');
    log(`Mensagem: ${error.message}`, 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('\n💡 SOLUÇÃO: Verifique se o servidor está rodando em http://localhost:3000', 'yellow');
      log('Comando: npm run start:dev (no diretório backend)', 'yellow');
    }
  }
}

// Executar testes se o arquivo for chamado diretamente
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testQueryAdapter,
  testTeamExtraction,
  testCompetitionInfo,
  testConfirmationSystem,
  testSlugSystem,
  testPerformance,
  testErrorHandling
};
