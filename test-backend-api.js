const https = require('https');

async function testBackendAPI() {
  console.log('🔍 Testando rotas da API do backend...\n');
  
  const routes = [
    '/health',
    '/teams',
    '/users', 
    '/whatsapp/status',
    '/competitions',
    '/matches'
  ];
  
  for (const route of routes) {
    try {
      const url = `https://kmizabot.h4xd66.easypanel.host${route}`;
      console.log(`🌐 Testando: ${url}`);
      
      const response = await new Promise((resolve, reject) => {
        const request = https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        
        request.on('error', reject);
        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      console.log(`✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const jsonData = JSON.parse(response.data);
          console.log(`📄 Response: ${JSON.stringify(jsonData).substring(0, 200)}...`);
        } catch {
          console.log(`📄 Response: ${response.data.substring(0, 100)}...`);
        }
      } else {
        console.log(`📄 Response: ${response.data.substring(0, 100)}...`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}\n`);
    }
  }
}

testBackendAPI().catch(console.error); 