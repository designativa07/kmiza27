/**
 * 🧪 TESTE: Classificador de Intenção com IA
 * 
 * Testa o novo sistema de classificação de intenção que usa GPT-4o-mini
 * 
 * Como usar:
 * 1. Configure OPENAI_API_KEY no .env
 * 2. Execute: node backend/test-ai-intent-classifier.js
 */

require('dotenv').config();

// Casos de teste com várias formas de perguntar a mesma coisa
const testCases = [
  // ========================================
  // 🎯 PRÓXIMO JOGO
  // ========================================
  {
    category: '🎯 Próximo Jogo',
    tests: [
      'próximo jogo do Flamengo',
      'quando o Flamengo joga',
      'o mengão joga quando?',
      'qnd joga o mengão?',
      'Flamengo joga hj?',
      'que dia joga o rubro-negro?',
    ],
    expectedIntent: 'next_match'
  },
  
  // ========================================
  // 📺 TRANSMISSÃO
  // ========================================
  {
    category: '📺 Transmissão',
    tests: [
      'onde passa Bahia x Fluminense',
      'que canal vai passar o jogo do Bahia',
      'como assistir Flamengo x Palmeiras',
      'onde assistir o jogo',
      'transmissão do jogo de hoje',
    ],
    expectedIntent: ['broadcast_info', 'specific_match_broadcast']
  },
  
  // ========================================
  // 📊 CLASSIFICAÇÃO
  // ========================================
  {
    category: '📊 Classificação',
    tests: [
      'tabela do brasileirão',
      'classificação da série A',
      'posição do Flamengo',
      'como está o Palmeiras na tabela',
      'quantos pontos tem o São Paulo',
    ],
    expectedIntent: ['table', 'team_position']
  },
  
  // ========================================
  // ⚽ ARTILHEIROS
  // ========================================
  {
    category: '⚽ Artilheiros',
    tests: [
      'artilheiros do brasileirão',
      'quem é o artilheiro da libertadores',
      'quem marcou mais gols',
      'goleadores do campeonato',
    ],
    expectedIntent: 'top_scorers'
  },
  
  // ========================================
  // 📅 JOGOS HOJE/SEMANA
  // ========================================
  {
    category: '📅 Jogos',
    tests: [
      'jogos de hoje',
      'quais jogos tem hoje',
      'jogos da semana',
      'que jogo tem agora',
    ],
    expectedIntent: ['matches_today', 'matches_week']
  },
  
  // ========================================
  // 👋 SAUDAÇÕES
  // ========================================
  {
    category: '👋 Saudações',
    tests: [
      'oi',
      'olá',
      'bom dia',
      'menu',
    ],
    expectedIntent: 'greeting'
  },
  
  // ========================================
  // 🤔 CASOS DIFÍCEIS (linguagem informal)
  // ========================================
  {
    category: '🤔 Casos Difíceis',
    tests: [
      'o mengão ta jogando hj?',
      'fluzao joga qnd?',
      'tricolor ta em q posicao?',
      'pq o palmeiras n joga hj?',
    ],
    expectedIntent: ['next_match', 'current_match', 'team_position', 'matches_today']
  }
];

async function runTests() {
  console.log('\n🧪 ========================================');
  console.log('   TESTE: Classificador de Intenção com IA');
  console.log('========================================\n');

  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ ERRO: OPENAI_API_KEY não configurada no .env');
    console.log('   Configure a chave para testar a classificação com IA\n');
    return;
  }

  console.log('✅ OpenAI configurada, iniciando testes...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let aiCalls = 0;
  let cacheHits = 0;

  // Simular o serviço (em produção, seria injetado)
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Cache simples para evitar chamadas repetidas
  const cache = new Map();

  async function classifyIntent(message) {
    const cacheKey = message.toLowerCase().trim();
    
    // Verificar cache
    if (cache.has(cacheKey)) {
      cacheHits++;
      return cache.get(cacheKey);
    }

    // Padrões ultra-rápidos
    const quickPatterns = {
      'oi': 'greeting',
      'olá': 'greeting',
      'ola': 'greeting',
      'menu': 'greeting',
      'tabela': 'table',
      'artilheiros': 'top_scorers',
      'jogos de hoje': 'matches_today',
      'jogos hoje': 'matches_today',
    };

    const lowerMessage = cacheKey;
    if (quickPatterns[lowerMessage]) {
      return { intent: quickPatterns[lowerMessage], confidence: 0.95, source: 'cache' };
    }

    // Classificação com IA
    aiCalls++;
    
    const availableIntents = [
      'next_match', 'last_match', 'current_match', 'team_position',
      'broadcast_info', 'specific_match_broadcast', 'matches_week', 'matches_today',
      'team_statistics', 'competition_stats', 'top_scorers', 'team_squad',
      'player_info', 'team_info', 'channels_info', 'table', 'competition_info',
      'favorite_team_summary', 'greeting', 'general_question', 'unknown'
    ];

    const systemPrompt = `Você é um classificador de intenções especializado em futebol brasileiro.

**SUA TAREFA:** Analisar a mensagem do usuário e classificar em um dos intents disponíveis.

**INTENTS DISPONÍVEIS:**
${availableIntents.map((intent, i) => `${i + 1}. ${intent}`).join('\n')}

**REGRAS IMPORTANTES:**
1. Retorne APENAS um JSON válido, sem texto adicional
2. Seja flexível com gírias e apelidos de times (Mengão = Flamengo, Tricolor = vários times, etc)
3. Entenda variações de linguagem informal ("qnd" = quando, "joga hj" = joga hoje)
4. Se detectar nome de time, jogador ou competição, extraia-os
5. Para partidas específicas (Time A x Time B), use 'specific_match_broadcast' se envolver transmissão
6. Confiança alta (>0.8) para perguntas claras, baixa (<0.6) para ambíguas

**FORMATO DE RESPOSTA:**
{
  "intent": "nome_do_intent",
  "confidence": 0.85,
  "entities": {
    "team": "Nome do Time",
    "competition": "nome da competição"
  },
  "reasoning": "Breve explicação"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { intent: 'unknown', confidence: 0.3, source: 'ai' };
      }

      const classification = JSON.parse(content);
      classification.source = 'ai';
      
      // Validar intent
      if (!availableIntents.includes(classification.intent)) {
        classification.intent = 'unknown';
        classification.confidence = 0.3;
      }

      cache.set(cacheKey, classification);
      return classification;

    } catch (error) {
      console.error(`   ❌ Erro na classificação: ${error.message}`);
      return { intent: 'unknown', confidence: 0, source: 'error' };
    }
  }

  // Executar testes
  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${testCase.category}`);
    console.log(`${'='.repeat(60)}\n`);

    for (const test of testCase.tests) {
      totalTests++;
      const result = await classifyIntent(test);
      
      const expectedIntents = Array.isArray(testCase.expectedIntent) 
        ? testCase.expectedIntent 
        : [testCase.expectedIntent];
      
      const passed = expectedIntents.includes(result.intent);
      
      if (passed) {
        passedTests++;
        console.log(`✅ "${test}"`);
      } else {
        console.log(`❌ "${test}"`);
      }
      
      console.log(`   → Intent: ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`);
      console.log(`   → Esperado: ${expectedIntents.join(' ou ')}`);
      console.log(`   → Fonte: ${result.source}`);
      if (result.reasoning) {
        console.log(`   → Raciocínio: ${result.reasoning}`);
      }
      console.log('');
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  console.log(`✅ Testes passados: ${passedTests}/${totalTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
  console.log(`🧠 Chamadas à IA: ${aiCalls}`);
  console.log(`⚡ Cache hits: ${cacheHits}`);
  console.log(`💰 Custo estimado: $${(aiCalls * 0.00015).toFixed(4)}`);
  console.log('='.repeat(60) + '\n');

  // Análise de performance
  if (passedTests / totalTests >= 0.8) {
    console.log('🎉 EXCELENTE! Taxa de acerto acima de 80%');
  } else if (passedTests / totalTests >= 0.6) {
    console.log('✅ BOM! Taxa de acerto aceitável, mas pode melhorar');
  } else {
    console.log('⚠️  ATENÇÃO! Taxa de acerto baixa, revisar prompts');
  }
  console.log('');
}

// Executar
runTests().catch(console.error);

