const https = require('https');

const options = {
  hostname: 'kmiza27-evolution.h4xd66.easypanel.host',
  port: 443,
  path: '/webhook/find/Kmiza27',
  method: 'GET',
  headers: {
    'apikey': 'DEEFCBB25D74-4E46-BE91-CA7852798094'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  res.setEncoding('utf8');
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const webhook = JSON.parse(data);
      console.log('📋 Status do Webhook:');
      console.log(`   URL: ${webhook.url}`);
      console.log(`   Habilitado: ${webhook.enabled}`);
      console.log(`   Eventos: ${webhook.events?.join(', ')}`);
      console.log('✅ Webhook configurado e funcionando!');
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro: ${e.message}`);
});

req.end(); 