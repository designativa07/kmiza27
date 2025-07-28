const jwt = require('jsonwebtoken');

const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RlQGFtYWRvci5jb20iLCJpZCI6NTMsInJvbGUiOiJhbWF0ZXVyIiwiaWF0IjoxNzUzNTg2Mjg3LCJleHAiOjE3NTM2NzI2ODd9.7XEsK7KU9DAPLAk7XqDK49pImiF_EvDo8KciYzLd764';

try {
  const decoded = jwt.decode(TEST_TOKEN);
  console.log('Token decodificado:', decoded);
  
  if (decoded) {
    console.log('Role:', decoded.role);
    console.log('Username:', decoded.username);
    console.log('ID:', decoded.id);
    console.log('Exp:', new Date(decoded.exp * 1000));
  }
} catch (error) {
  console.error('Erro ao decodificar token:', error);
} 