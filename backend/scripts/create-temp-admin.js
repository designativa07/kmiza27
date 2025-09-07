const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Carregar variáveis de ambiente do arquivo correto
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

async function createTempAdmin() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    console.log('🔧 Criando usuário admin temporário');
    console.log('===================================');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    const email = 'admin@test.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar se o usuário já existe
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('👤 Usuário já existe, atualizando senha...');
      await client.query(
        'UPDATE users SET password = $1, role = $2 WHERE email = $3',
        [hashedPassword, 'admin', email]
      );
    } else {
      console.log('👤 Criando novo usuário admin...');
      await client.query(
        'INSERT INTO users (email, password, name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [email, hashedPassword, 'Admin Test', 'admin']
      );
    }

    console.log('✅ Usuário admin criado/atualizado com sucesso!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

createTempAdmin();

