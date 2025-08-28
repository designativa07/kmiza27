const { OpenAIService } = require('../src/chatbot/openai.service');
const { BotConfigService } = require('../src/modules/bot-config/bot-config.service');
const { TeamsService } = require('../src/modules/teams/teams.service');

async function testAvaiMessage() {
  console.log('🧪 Testando mensagem com Avaí usando sistema corrigido...\n');

  try {
    // Mock dos serviços necessários
    const botConfigService = {
      getOpenAIConfig: () => ({ apiKey: 'test', model: 'gpt-3.5-turbo' })
    };
    
    const teamsService = {
      findAll: async () => ({
        data: [
          {
            name: 'Avaí',
            short_name: 'AVA',
            slug: 'avai',
            aliases: ['avai', 'avai fc', 'avai futebol clube', 'leão da ilha', 'leao da ilha']
          },
          {
            name: 'Bahia',
            short_name: 'BAH',
            slug: 'bahia',
            aliases: ['bahia', 'bahia ec', 'tricolor', 'esporte clube bahia']
          }
        ]
      })
    };

    const openaiService = new OpenAIService(botConfigService, teamsService);
    
    // Aguardar inicialização
    await openaiService.onModuleInit();
    
    console.log('📋 Lista de nomes de times carregados:');
    console.log(openaiService.teamNames);
    console.log('\n' + '='.repeat(60) + '\n');

    // Testar diferentes variações para Avaí
    const testCases = [
      'Onde assistir Avaí x Bahia?',
      'Transmissão AVAÍ x BAHIA',
      'Canais avai vs bahia',
      'leão da ilha x tricolor'
    ];

    console.log('🔍 Testando análise de mensagens:');
    
    for (const testCase of testCases) {
      console.log(`\n📝 Testando: "${testCase}"`);
      
      try {
        const analysis = await openaiService.analyzeMessage(testCase);
        console.log(`✅ Intent detectado: ${analysis.intent}`);
        
        if (analysis.intent === 'specific_match_broadcast') {
          console.log(`   🏠 Home Team: ${analysis.homeTeam}`);
          console.log(`   🚌 Away Team: ${analysis.awayTeam}`);
          console.log(`   📊 Confiança: ${analysis.confidence}`);
        } else if (analysis.intent === 'broadcast_info') {
          console.log(`   🏟️ Time: ${analysis.team}`);
          console.log(`   📊 Confiança: ${analysis.confidence}`);
        } else {
          console.log(`   📊 Confiança: ${analysis.confidence}`);
        }
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testAvaiMessage().catch(console.error);