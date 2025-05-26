const https = require('https');

async function testCacheClear() {
  console.log('🧹 Testando limpeza do cache da Evolution API...\n');

  const results = [];
  
  // Método 1: Tentar restart (PUT /instance/restart/{instance})
  console.log('1️⃣ Tentando restart da instância...');
  try {
    const restartResult = await new Promise((resolve) => {
      const req = https.request({
        hostname: 'kmiza27-evolution.h4xd66.easypanel.host',
        port: 443,
        path: '/instance/restart/kmizabot',
        method: 'PUT',
        headers: {
          'apikey': '95DC243F41B2-4858-B0F1-FF49D8C46A85',
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
          } catch {
            resolve({ status: res.statusCode, data: null, raw: data });
          }
        });
      });
      req.on('error', (error) => resolve({ status: 500, data: null, raw: error.message }));
      req.end();
    });
    
    console.log(`   Status: ${restartResult.status}`);
    console.log(`   Resposta: ${restartResult.raw}`);
    
    results.push({ 
      method: 'restart', 
      status: restartResult.status, 
      data: restartResult.data,
      error: restartResult.status >= 400 ? restartResult.raw : undefined
    });
    
    if (restartResult.status >= 200 && restartResult.status < 300) {
      console.log('✅ Restart bem-sucedido!');
      return { success: true, method: 'restart', details: results };
    }
  } catch (error) {
    console.log(`   Erro: ${error.message}`);
    results.push({ method: 'restart', status: 500, error: error.message });
  }
  
  console.log('\n2️⃣ Tentando logout...');
  try {
    const logoutResult = await new Promise((resolve) => {
      const req = https.request({
        hostname: 'kmiza27-evolution.h4xd66.easypanel.host',
        port: 443,
        path: '/instance/logout/kmizabot',
        method: 'DELETE',
        headers: {
          'apikey': '95DC243F41B2-4858-B0F1-FF49D8C46A85',
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
          } catch {
            resolve({ status: res.statusCode, data: data, raw: data });
          }
        });
      });
      req.on('error', (error) => resolve({ status: 500, data: null, raw: error.message }));
      req.end();
    });
    
    console.log(`   Status: ${logoutResult.status}`);
    console.log(`   Resposta: ${logoutResult.raw}`);
    
    results.push({ method: 'logout', status: logoutResult.status, data: logoutResult.data });
    
    if (logoutResult.status >= 200 && logoutResult.status < 300) {
      console.log('✅ Logout bem-sucedido!');
      
      // Aguardar um pouco
      console.log('\n⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Tentar conectar novamente
      console.log('\n3️⃣ Tentando conectar...');
      const connectResult = await new Promise((resolve) => {
        const req = https.request({
          hostname: 'kmiza27-evolution.h4xd66.easypanel.host',
          port: 443,
          path: '/instance/connect/kmizabot',
          method: 'GET',
          headers: {
            'apikey': '95DC243F41B2-4858-B0F1-FF49D8C46A85',
            'Content-Type': 'application/json'
          }
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
            } catch {
              resolve({ status: res.statusCode, data: data, raw: data });
            }
          });
        });
        req.on('error', (error) => resolve({ status: 500, data: null, raw: error.message }));
        req.end();
      });
      
      console.log(`   Status: ${connectResult.status}`);
      console.log(`   Resposta: ${connectResult.raw}`);
      
      results.push({ method: 'connect', status: connectResult.status, data: connectResult.data });
      
      return { success: true, method: 'logout-connect', details: results };
    }
  } catch (error) {
    console.log(`   Erro: ${error.message}`);
    results.push({ method: 'logout', status: 500, error: error.message });
  }
  
  console.log('\n❌ Todos os métodos falharam');
  console.log('\n📋 INSTRUÇÕES MANUAIS:');
  console.log('1. Acesse a interface da Evolution API');
  console.log('2. Clique no botão "RESTART" ou "DISCONNECT"');
  console.log('3. Aguarde alguns segundos');
  console.log('4. Se necessário, clique em "CONNECT"');
  console.log('5. Atualize as conversas no dashboard');
  
  return { success: false, details: results };
}

// Executar teste
testCacheClear().then(result => {
  console.log('\n🏁 RESULTADO FINAL:');
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('\n❌ ERRO CRÍTICO:', error);
}); 