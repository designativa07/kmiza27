const jwt = require('jsonwebtoken');

const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

function testToken() {
  try {
    console.log('Testando token...');
    
    // Verificar se o token pode ser decodificado
    const decoded = jwt.decode(TEST_TOKEN);
    console.log('Token decodificado:', decoded);
    
    // Verificar se o token não expirou
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('Token expirado!');
      console.log('Expira em:', new Date(decoded.exp * 1000));
      console.log('Agora:', new Date(now * 1000));
    } else {
      console.log('Token válido!');
      console.log('Expira em:', new Date(decoded.exp * 1000));
    }
    
  } catch (error) {
    console.error('Erro ao testar token:', error);
  }
}

testToken(); 