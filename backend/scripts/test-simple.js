const axios = require('axios');

async function testConnection() {
  try {
    console.log('🔍 Testando conectividade com o backend...\n');
    
    // Testar diferentes portas
    const ports = [3000, 3001, 3002, 3004, 3005];
    
    for (const port of ports) {
      try {
        console.log(`📡 Testando porta ${port}...`);
        const response = await axios.get(`http://localhost:${port}/`, { timeout: 2000 });
        console.log(`✅ Porta ${port} - Status: ${response.status}`);
        console.log(`   Resposta: ${JSON.stringify(response.data).substring(0, 100)}...`);
        console.log('');
      } catch (error) {
        console.log(`❌ Porta ${port} - ${error.message}`);
      }
    }
    
    // Testar endpoints específicos na porta 3004
    console.log('🧪 Testando endpoints específicos na porta 3004...\n');
    
    const endpoints = [
      '/',
      '/health',
      '/teams',
      '/bot-config',
      '/chatbot/test-message'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📝 Testando: ${endpoint}`);
        const response = await axios.get(`http://localhost:3004${endpoint}`, { timeout: 2000 });
        console.log(`✅ Status: ${response.status}`);
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

testConnection(); 