const fetch = require('node-fetch');

async function testImageUrls() {
  const urls = [
    'https://exemplo.com/escudo.png',
    'https://exemplo.com/logo.png',
    'https://cdn.kmiza27.com/img/escudos/test.png'
  ];

  console.log('Testando URLs de imagem...');
  
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

testImageUrls(); 