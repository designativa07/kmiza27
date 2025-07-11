const https = require('https');

console.log('🧪 TESTANDO API KEY DA EVOLUTION API');
console.log('🔑 API Key: 7C761B66EE97-498A-A058-E27A33A4AD78');
console.log('🌐 URL: https://evolution.kmiza27.com');

// Teste 1: Verificar instâncias
console.log('\n1️⃣ Testando fetchInstances...');

const options = {
  hostname: 'evolution.kmiza27.com',
  port: 443,
  path: '/instance/fetchInstances',
  method: 'GET',
  headers: {
    'apikey': '7C761B66EE97-498A-A058-E27A33A4AD78',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ API Key funciona via Node.js HTTPS!');
      try {
        const instances = JSON.parse(data);
        const kmiza27 = instances.find(i => i.name === 'Kmiza27');
        if (kmiza27) {
          console.log(`🤖 Instância Kmiza27 encontrada:`);
          console.log(`   - Status: ${kmiza27.connectionStatus}`);
          console.log(`   - ID: ${kmiza27.id}`);
          
          // Teste 2: Enviar mensagem
          console.log('\n2️⃣ Testando envio de mensagem...');
          testSendMessage();
        } else {
          console.log('❌ Instância Kmiza27 não encontrada');
        }
      } catch (e) {
        console.log('❌ Erro ao parsear JSON:', e.message);
        console.log('📄 Resposta raw:', data);
      }
    } else {
      console.log('❌ API Key não funciona via Node.js HTTPS');
      console.log('📄 Resposta:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
});

req.end();

function testSendMessage() {
  const messageData = JSON.stringify({
    number: "5548996652575",
    text: "Teste via Node.js HTTPS"
  });

  const messageOptions = {
    hostname: 'evolution.kmiza27.com',
    port: 443,
    path: '/message/sendText/Kmiza27',
    method: 'POST',
    headers: {
      'apikey': '7C761B66EE97-498A-A058-E27A33A4AD78',
      'Content-Type': 'application/json',
      'Content-Length': messageData.length
    }
  };

  const messageReq = https.request(messageOptions, (res) => {
    console.log(`📊 Status envio: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ Mensagem enviada com sucesso via Node.js HTTPS!');
        console.log('📄 Resposta:', data);
      } else {
        console.log('❌ Erro ao enviar mensagem via Node.js HTTPS');
        console.log('📄 Resposta:', data);
      }
      
      // Teste 3: Fetch API
      console.log('\n3️⃣ Testando com fetch API...');
      testWithFetch();
    });
  });

  messageReq.on('error', (e) => {
    console.error('❌ Erro no envio:', e.message);
  });

  messageReq.write(messageData);
  messageReq.end();
}

async function testWithFetch() {
  try {
    console.log('🔍 Testando fetch API...');
    
    const response = await fetch('https://evolution.kmiza27.com/message/sendText/Kmiza27', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': '7C761B66EE97-498A-A058-E27A33A4AD78',
      },
      body: JSON.stringify({
        number: "5548996652575",
        text: "Teste via fetch API"
      }),
    });

    console.log(`📊 Status fetch: ${response.status}`);
    console.log(`📋 Headers fetch:`, Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    
    if (response.ok) {
      console.log('✅ Mensagem enviada com sucesso via fetch API!');
      console.log('📄 Resposta:', result);
    } else {
      console.log('❌ Erro ao enviar mensagem via fetch API');
      console.log('📄 Resposta:', result);
    }
    
  } catch (error) {
    console.error('❌ Erro no fetch:', error.message);
  }
} 