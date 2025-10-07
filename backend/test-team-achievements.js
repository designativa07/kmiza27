/**
 * 🧪 TESTE: Intent team_achievements (Títulos e Conquistas)
 * 
 * Testa se o sistema detecta corretamente perguntas sobre histórico/títulos
 * e NÃO confunde com perguntas sobre próximos jogos
 * 
 * Como usar:
 * 1. Configure OPENAI_API_KEY no .env
 * 2. Execute: node backend/test-team-achievements.js
 */

require('dotenv').config();

// Casos de teste para team_achievements vs next_match
const testCases = [
  // ========================================
  // 🏆 TEAM ACHIEVEMENTS (Histórico/Títulos)
  // ========================================
  {
    category: '🏆 Títulos e Conquistas (DEVE usar IA)',
    tests: [
      'quantas vezes o flamengo ganhou o brasileirão',
      'quantos títulos o palmeiras tem',
      'o santos é campeão de quê',
      'história do corinthians',
      'conquistas do são paulo',
      'quantas libertadores o flamengo ganhou',
      'o flamengo foi campeão do mundo',
      'títulos do palmeiras',
      'qual time brasileiro tem mais títulos',
    ],
    expectedIntent: 'team_achievements'
  },
  
  // ========================================
  // ⚽ NEXT MATCH (NÃO deve confundir!)
  // ========================================
  {
    category: '⚽ Próximos Jogos (NÃO é conquista)',
    tests: [
      'quando o flamengo joga',
      'próximo jogo do flamengo',
      'o flamengo joga hoje',
      'que horas o flamengo joga',
      'flamengo x palmeiras quando',
    ],
    expectedIntent: 'next_match'
  },
  
  // ========================================
  // 🎯 ARTILHEIROS (DEVE usar IA)
  // ========================================
  {
    category: '🎯 Artilheiros (DEVE usar IA)',
    tests: [
      'artilheiros do brasileirão',
      'quem é o artilheiro',
      'goleadores da libertadores',
      'quem marcou mais gols',
      'artilharia do campeonato',
    ],
    expectedIntent: 'top_scorers'
  },
  
  // ========================================
  // 👤 JOGADORES (DEVE usar IA)
  // ========================================
  {
    category: '👤 Informações de Jogadores (DEVE usar IA)',
    tests: [
      'informações do Neymar',
      'quem é o Gabigol',
      'dados do Pedro',
      'qual time o Vinicius Junior joga',
      'posição do Casemiro',
    ],
    expectedIntent: 'player_info'
  }
];

async function runTests() {
  console.log('\n🧪 ========================================');
  console.log('   TESTE: team_achievements vs next_match');
  console.log('========================================\n');

  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ ERRO: OPENAI_API_KEY não configurada no .env');
    return;
  }

  console.log('✅ OpenAI configurada, iniciando testes...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let aiCalls = 0;

  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async function classifyIntent(message) {
    aiCalls++;
    
    const availableIntents = [
      'next_match', 'last_match', 'current_match', 'team_position',
      'broadcast_info', 'specific_match_broadcast', 'matches_week', 'matches_today',
      'team_statistics', 'competition_stats', 'top_scorers', 'team_squad',
      'player_info', 'team_info', 'team_achievements', 'channels_info',
      'table', 'competition_info', 'favorite_team_summary', 'greeting',
      'general_question', 'unknown'
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
7. **CRÍTICO:** Diferencie perguntas HISTÓRICAS (passado/títulos) de perguntas sobre JOGOS FUTUROS
   - "ganhou", "títulos", "campeão", "quantas vezes", "história" → team_achievements
   - "joga", "vai jogar", "próximo", "quando joga" → next_match

**EXEMPLOS:**
Usuário: "o mengão joga quando?"
Resposta: {"intent": "next_match", "confidence": 0.92, "entities": {"team": "Flamengo"}, "reasoning": "Pergunta sobre próximo jogo do Flamengo (mengão = apelido)"}

Usuário: "quantas vezes o flamengo ganhou o brasileirão"
Resposta: {"intent": "team_achievements", "confidence": 0.95, "entities": {"team": "Flamengo", "competition": "brasileirão"}, "reasoning": "Pergunta sobre histórico de títulos, não sobre jogos futuros"}

Usuário: "o palmeiras é campeão de quê"
Resposta: {"intent": "team_achievements", "confidence": 0.90, "entities": {"team": "Palmeiras"}, "reasoning": "Pergunta sobre conquistas e títulos históricos"}

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
      
      if (!availableIntents.includes(classification.intent)) {
        classification.intent = 'unknown';
        classification.confidence = 0.3;
      }

      return classification;

    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}`);
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
      
      const passed = result.intent === testCase.expectedIntent;
      
      if (passed) {
        passedTests++;
        console.log(`✅ "${test}"`);
      } else {
        console.log(`❌ "${test}"`);
      }
      
      console.log(`   → Detectado: ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`);
      console.log(`   → Esperado: ${testCase.expectedIntent}`);
      if (result.reasoning) {
        console.log(`   → Raciocínio: ${result.reasoning}`);
      }
      if (result.entities?.team) {
        console.log(`   → Time: ${result.entities.team}`);
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
  console.log(`💰 Custo estimado: $${(aiCalls * 0.00015).toFixed(4)}`);
  console.log('='.repeat(60) + '\n');

  if (passedTests / totalTests >= 0.9) {
    console.log('🎉 EXCELENTE! Taxa de acerto acima de 90% - problema resolvido!');
  } else if (passedTests / totalTests >= 0.8) {
    console.log('✅ BOM! Taxa de acerto acima de 80%');
  } else if (passedTests / totalTests >= 0.7) {
    console.log('⚠️  ATENÇÃO! Taxa de acerto entre 70-80%, pode melhorar');
  } else {
    console.log('❌ PROBLEMA! Taxa de acerto abaixo de 70%, revisar prompts');
  }
  console.log('');
}

runTests().catch(console.error);

