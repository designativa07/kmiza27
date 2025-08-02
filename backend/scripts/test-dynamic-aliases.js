const axios = require('axios');

async function testDynamicAliases() {
  try {
    console.log('🔍 Testando sistema de aliases dinâmicos...\n');
    
    // 1. Testar busca de times com aliases
    console.log('📝 1. Buscando times com aliases...');
    const teamsResponse = await axios.get('http://localhost:3000/teams/all');
    const teamsWithAliases = teamsResponse.data.filter(team => team.aliases && team.aliases.length > 0);
    
    console.log(`✅ Encontrados ${teamsWithAliases.length} times com aliases:`);
    teamsWithAliases.forEach(team => {
      console.log(`  - ${team.name}: [${team.aliases.join(', ')}]`);
    });
    console.log('');

    // 2. Testar detecção de aliases no chatbot
    console.log('📝 2. Testando detecção de aliases no chatbot...');
    const testAliases = [
      'fogão',
      'mengão', 
      'vascão',
      'verdão',
      'timão',
      'são paulo'
    ];

    for (const alias of testAliases) {
      try {
        console.log(`  Testando alias: "${alias}"`);
        
        const response = await axios.post('http://localhost:3000/chatbot/test-message', {
          message: alias,
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

    // 3. Testar API de aliases
    console.log('📝 3. Testando API de aliases...');
    
    // Buscar um time para testar
    const testTeam = teamsWithAliases[0];
    if (testTeam) {
      console.log(`  Testando com time: ${testTeam.name}`);
      
      // Testar GET de aliases
      try {
        const getResponse = await axios.get(`http://localhost:3000/teams/${testTeam.id}`);
        console.log(`    ✅ GET aliases: ${JSON.stringify(getResponse.data.aliases)}`);
      } catch (error) {
        console.log(`    ❌ Erro GET: ${error.response?.status || error.message}`);
      }

      // Testar PATCH de aliases
      try {
        const newAliases = [...(testTeam.aliases || []), 'teste-dinamico'];
        const patchResponse = await axios.patch(`http://localhost:3000/teams/${testTeam.id}/aliases`, {
          aliases: newAliases
        });
        console.log(`    ✅ PATCH aliases: ${JSON.stringify(patchResponse.data.aliases)}`);
      } catch (error) {
        console.log(`    ❌ Erro PATCH: ${error.response?.status || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testDynamicAliases(); 