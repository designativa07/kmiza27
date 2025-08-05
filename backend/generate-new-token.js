const jwt = require('jsonwebtoken');

// Dados do usuário Antonio Medeiros (ID 19)
const payload = {
  username: 'antonio.medeiros@gmail.com',
  sub: 19,
  is_admin: true,
  role: 'admin'
};

// Secret key (mesma usada no backend)
const secret = 'kmiza27_secret_key_admin';

// Gerar token válido por 24 horas
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('🔑 Novo token JWT gerado:');
console.log(token);
console.log('\n📋 Payload decodificado:');
console.log(JSON.stringify(payload, null, 2)); 