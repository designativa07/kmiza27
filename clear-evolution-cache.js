const https = require('https');

const EVOLUTION_API_URL = 'kmiza27-evolution.h4xd66.easypanel.host';
const API_KEY = 'DEEFCBB25D74-4E46-BE91-CA7852798094';
const INSTANCE_NAME = 'Kmiza27';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: EVOLUTION_API_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function clearEvolutionCache() {
  console.log('🧹 Iniciando limpeza do cache da Evolution API...\n');

  try {
    // 1. Verificar status atual
    console.log('1️⃣ Verificando status da instância...');
    const statusResponse = await makeRequest(`/instance/connectionState/${INSTANCE_NAME}`);
    console.log(`   Status: ${statusResponse.status} - ${JSON.stringify(statusResponse.data)}\n`);

    // 2. Limpar cache de mensagens
    console.log('2️⃣ Limpando cache de mensagens...');
    const clearMessagesResponse = await makeRequest(`/chat/deleteMessage/${INSTANCE_NAME}`, 'DELETE', {
      where: {
        owner: INSTANCE_NAME
      }
    });
    console.log(`   Resultado: ${clearMessagesResponse.status} - ${JSON.stringify(clearMessagesResponse.data)}\n`);

    // 3. Limpar cache de conversas
    console.log('3️⃣ Limpando cache de conversas...');
    const clearChatsResponse = await makeRequest(`/chat/deleteChat/${INSTANCE_NAME}`, 'DELETE', {
      where: {
        owner: INSTANCE_NAME
      }
    });
    console.log(`   Resultado: ${clearChatsResponse.status} - ${JSON.stringify(clearChatsResponse.data)}\n`);

    // 4. Restart da instância (método mais eficaz)
    console.log('4️⃣ Reiniciando instância para limpeza completa...');
    const restartResponse = await makeRequest(`/instance/restart/${INSTANCE_NAME}`, 'PUT');
    console.log(`   Resultado: ${restartResponse.status} - ${JSON.stringify(restartResponse.data)}\n`);

    // 5. Aguardar reconexão
    console.log('5️⃣ Aguardando reconexão...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos

    // 6. Verificar status final
    console.log('6️⃣ Verificando status final...');
    const finalStatusResponse = await makeRequest(`/instance/connectionState/${INSTANCE_NAME}`);
    console.log(`   Status Final: ${finalStatusResponse.status} - ${JSON.stringify(finalStatusResponse.data)}\n`);

    console.log('✅ Limpeza do cache concluída!');
    console.log('📱 A instância deve estar reconectada e com cache limpo.');
    console.log('🔄 Teste enviando uma mensagem para verificar se está funcionando.');

  } catch (error) {
    console.error('❌ Erro durante a limpeza do cache:', error);
  }
}

// Executar limpeza
clearEvolutionCache(); 