const https = require('https');

const data = JSON.stringify({
  url: "https://api.kmiza27.com/chatbot/webhook",
  enabled: true,
  events: ["MESSAGES_UPSERT"]
});

const options = {
  hostname: 'evolution.kmiza27.com',
  port: 443,
  path: '/webhook/set/Kmiza27',
  method: 'POST',
  headers: {
    'apikey': '7C761B66EE97-498A-A058-E27A33A4AD78',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('✅ Webhook configurado com sucesso!');
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro: ${e.message}`);
});

req.write(data);
req.end(); 