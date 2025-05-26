const https = require('https');

async function testBackend() {
  console.log('🔍 Testando conexão com o backend...\n');
  
  const urls = [
    'https://kmizabot.h4xd66.easypanel.host/health',
    'https://kmizabot.h4xd66.easypanel.host/',
  ];
  
  for (const url of urls) {
    try {
      console.log(`🌐 Testando: ${url}`);
      
      const response = await new Promise((resolve, reject) => {
        const request = https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
        });
        
        request.on('error', reject);
        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📄 Response: ${response.data}`);
      console.log(`📋 Headers:`, response.headers);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}\n`);
    }
  }
}

testBackend().catch(console.error); 