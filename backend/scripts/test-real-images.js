const fetch = require('node-fetch');

async function testRealImages() {
  const urls = [
    'https://cdn.kmiza27.com/img/escudos/botafogo.svg',
    'https://cdn.kmiza27.com/img/logo-competition/copa-brasil.png',
    'https://cdn.kmiza27.com/img/og-images/og-image-1752700830770',
    'https://cdn.kmiza27.com/img/futepedia-logos/futepedia-logo-1752700830915'
  ];

  console.log('Testando URLs reais do CDN...');
  
  for (const url of urls) {
    try {
      console.log(`\nTestando: ${url}`);
      const response = await fetch(url);
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.ok) {
        console.log('✅ URL acessível');
      } else {
        console.log('❌ URL não acessível');
      }
    } catch (error) {
      console.log(`❌ Erro ao acessar: ${error.message}`);
    }
  }
}

testRealImages(); 