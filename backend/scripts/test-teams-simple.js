const axios = require('axios');

async function testTeams() {
  try {
    console.log('🔍 Testando busca de times...\n');
    
    // Testar diferentes endpoints de times
    const endpoints = [
      '/teams',
      '/teams?limit=5',
      '/teams/all',
      '/teams?search=flamengo',
      '/teams?search=botafogo'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📝 Testando: ${endpoint}`);
        const response = await axios.get(`http://localhost:3000${endpoint}`, { timeout: 5000 });
        console.log(`✅ Status: ${response.status}`);
        
        if (response.data && response.data.data) {
          console.log(`   Encontrados: ${response.data.data.length} times`);
          if (response.data.data.length > 0) {
            console.log(`   Primeiro time: ${response.data.data[0].name}`);
          }
        } else if (response.data && Array.isArray(response.data)) {
          console.log(`   Encontrados: ${response.data.length} times`);
          if (response.data.length > 0) {
            console.log(`   Primeiro time: ${response.data[0].name}`);
          }
        }
        console.log('');
      } catch (error) {
        console.log(`❌ Erro: ${error.response?.status || error.message}`);
        if (error.response?.data) {
          console.log(`   Dados: ${JSON.stringify(error.response.data)}`);
        }
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testTeams(); 