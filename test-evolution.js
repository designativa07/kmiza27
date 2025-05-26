// Usando fetch nativo do Node.js 18+

const config = {
  apiUrl: 'https://kmiza27-evolution.h4xd66.easypanel.host',
  apiKey: 'DEEFCBB25D74-4E46-BE91-CA7852798094',
  instanceName: 'Kmiza27'
};

async function testEvolutionAPI() {
  console.log('🧪 TESTANDO EVOLUTION API DIRETAMENTE...');
  console.log(`🌐 URL: ${config.apiUrl}`);
  console.log(`📱 Instance: ${config.instanceName}`);
  console.log(`🔑 API Key: ${config.apiKey ? '***SET***' : 'NOT_SET'}`);

  // Teste 1: Verificar instâncias
  try {
    console.log('\n📋 TESTE 1: Verificando instâncias...');
    const instanceUrl = `${config.apiUrl}/instance/fetchInstances`;
    console.log(`URL: ${instanceUrl}`);
    
    const response = await fetch(instanceUrl, {
      method: 'GET',
      headers: {
        'apikey': config.apiKey,
      },
    });

    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const instances = await response.json();
      console.log('✅ Instâncias encontradas:', instances);
      
      const instance = instances.find(inst => inst.name === config.instanceName);
      if (instance) {
        console.log(`✅ Instância ${config.instanceName} encontrada:`, instance);
      } else {
        console.log(`❌ Instância ${config.instanceName} NÃO encontrada`);
        console.log('Instâncias disponíveis:', instances.map(inst => inst.name));
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Teste 2: Enviar mensagem
  try {
    console.log('\n📱 TESTE 2: Enviando mensagem de teste...');
    const sendUrl = `${config.apiUrl}/message/sendText/${config.instanceName}`;
    console.log(`URL: ${sendUrl}`);
    
    const payload = {
      number: '5554896652575', // Número de teste
      text: '🧪 TESTE DIRETO - Mensagem de teste da Evolution API'
    };
    
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    console.log(`Status: ${response.status}`);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Mensagem enviada com sucesso:', result);
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro: ${response.status} - ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Detalhes do erro:', errorJson);
      } catch (e) {
        console.log('Erro em texto puro:', errorText);
      }
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }
}

testEvolutionAPI().catch(console.error); 