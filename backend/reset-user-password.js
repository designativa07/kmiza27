const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para resetar a senha do usuário admin
 */

async function resetUserPassword() {
  console.log('🔧 Resetando senha do usuário admin...');

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

    // 1. Verificar usuário existente
    const userResult = await devClient.query(
      'SELECT id, email, name, is_admin, is_active FROM users WHERE email = $1;',
      ['antonioddd48@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const user = userResult.rows[0];
    console.log(`👤 Usuário encontrado: ${user.email} (ID: ${user.id})`);

    // 2. Gerar nova senha hash
    const newPassword = '@toni123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('🔐 Nova senha hash gerada');

    // 3. Atualizar senha no banco
    await devClient.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2;',
      [hashedPassword, user.id]
    );

    console.log('✅ Senha atualizada com sucesso!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Senha: ${newPassword}`);

    // 4. Verificar se o usuário está ativo
    await devClient.query(
      'UPDATE users SET is_active = true WHERE id = $1;',
      [user.id]
    );

    console.log('✅ Usuário ativado');

  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  resetUserPassword()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { resetUserPassword };

