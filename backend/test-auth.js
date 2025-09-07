const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para testar autenticação
 */

async function testAuth() {
  console.log('🔐 Testando autenticação...');

  // Configuração do banco de desenvolvimento
  const devClient = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    await devClient.connect();
    console.log('✅ Conectado ao banco de desenvolvimento');

    // 1. Buscar usuário admin
    const userResult = await devClient.query(
      'SELECT id, email, password_hash, name, is_admin, is_active FROM users WHERE email = $1;',
      ['admin@kmiza27.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const user = userResult.rows[0];
    console.log(`👤 Usuário encontrado: ${user.email} (ID: ${user.id})`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👑 Admin: ${user.is_admin}`);
    console.log(`✅ Ativo: ${user.is_active}`);
    console.log(`🔐 Hash da senha: ${user.password_hash.substring(0, 20)}...`);

    // 2. Testar senha
    const testPassword = 'admin123';
    const isValidPassword = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log(`\n🔍 Testando senha: ${testPassword}`);
    console.log(`✅ Senha válida: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log('🔧 Gerando nova senha...');
      const newHashedPassword = await bcrypt.hash(testPassword, 10);
      
      await devClient.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2;',
        [newHashedPassword, user.id]
      );
      
      console.log('✅ Nova senha salva!');
      
      // Testar novamente
      const isValidNewPassword = await bcrypt.compare(testPassword, newHashedPassword);
      console.log(`✅ Nova senha válida: ${isValidNewPassword}`);
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAuth()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testAuth };

