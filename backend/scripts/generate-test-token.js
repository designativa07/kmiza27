const jwt = require('jsonwebtoken');

const JWT_SECRET = 'kmiza27_secret_key_admin';

// Dados do usuário amador
const userPayload = {
  username: 'teste@amador.com',
  id: 53,
  role: 'amateur'
};

// Gerar token
const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });

console.log('Token gerado:');
console.log(token);

// Verificar token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\nToken decodificado:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('Erro ao verificar token:', error);
} 