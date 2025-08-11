const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🔐 Testando API de login...');
    
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin@kmiza27.com',
        password: 'admin123'
      })
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login bem-sucedido!');
      console.log('Token:', data.access_token);
      console.log('User:', data.user);
      
      // Testar o token gerado
      const token = data.access_token;
      console.log('\n🧪 Testando token gerado...');
      
      const verifyResponse = await fetch('http://localhost:3000/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Verify Status:', verifyResponse.status);
      const verifyData = await verifyResponse.json();
      console.log('Verify Response:', verifyData);
      
    } else {
      const error = await response.json();
      console.log('❌ Erro no login:', error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testLogin(); 