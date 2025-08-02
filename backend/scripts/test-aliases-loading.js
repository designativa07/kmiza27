const axios = require('axios');

async function testAliasesLoading() {
  try {
    console.log('🔍 Testando carregamento de aliases...\n');

    // 1. Verificar se os aliases estão no banco
    console.log('📝 1. Verificando aliases no banco...');
    const teamsResponse = await axios.get('http://localhost:3000/teams?limit=1000');
    const teams = teamsResponse.data.data;
    
    const teamsWithAliases = teams.filter(team => team.aliases && team.aliases.length > 0);
    console.log(`✅ Encontrados ${teamsWithAliases.length} times com aliases:`);
    
    teamsWithAliases.forEach(team => {
      console.log(`  - ${team.name}: ${JSON.stringify(team.aliases)}`);
    });

    // 2. Testar diferentes variações do São Paulo
    console.log('\n📝 2. Testando variações do São Paulo...');
    const saoPauloTests = [
      'são paulo',
      'sao paulo', 
      'spfc',
      'São Paulo',
      'Sao Paulo'
    ];

    for (const test of saoPauloTests) {
      try {
        console.log(`  Testando: "${test}"`);
        
        const response = await axios.post('http://localhost:3000/chatbot/test-message', {
          message: test,
          phoneNumber: '5511999999999'
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`    ✅ Status: ${response.status}`);
        console.log(`    ✅ Resposta: ${response.data.response || response.data}`);
        console.log('');
      } catch (error) {
        console.log(`    ❌ Erro: ${error.response?.status || error.message}`);
        console.log('');
      }
    }

    // 3. Testar debug do chatbot
    console.log('📝 3. Testando debug do chatbot...');
    try {
      const debugResponse = await axios.post('http://localhost:3000/chatbot/debug-analysis', {
        message: 'sao paulo',
        phoneNumber: '5511999999999'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Debug response: ${JSON.stringify(debugResponse.data, null, 2)}`);
    } catch (error) {
      console.log(`❌ Erro no debug: ${error.response?.status || error.message}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAliasesLoading(); 