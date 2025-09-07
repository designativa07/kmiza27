const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para criar um usuário admin simples
 */

async function createSimpleAdmin() {
  console.log('👤 Criando usuário admin simples...');

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

    // 1. Verificar se já existe
    const existingUser = await devClient.query(
      'SELECT id, email FROM users WHERE email = $1;',
      ['admin@kmiza27.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('👤 Usuário admin já existe, atualizando senha...');
      
      // Atualizar senha
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await devClient.query(
        'UPDATE users SET password_hash = $1, is_active = true, is_admin = true WHERE email = $2;',
        [hashedPassword, 'admin@kmiza27.com']
      );
      
      console.log('✅ Senha atualizada!');
    } else {
      console.log('👤 Criando novo usuário admin...');
      
      // Criar novo usuário
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await devClient.query(`
        INSERT INTO users (
          phone_number,
          email, 
          password_hash, 
          name, 
          is_admin, 
          is_active, 
          created_at, 
          updated_at,
          role,
          origin,
          whatsapp_status
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9)
        RETURNING id, email, name, is_admin, is_active;
      `, [
        '5511888888888',
        'admin@kmiza27.com',
        hashedPassword,
        'Admin Kmiza27',
        true,
        true,
        'admin',
        'manual',
        'active'
      ]);
      
      console.log('✅ Usuário admin criado!');
    }

    console.log('\n📧 Credenciais:');
    console.log('   Email: admin@kmiza27.com');
    console.log('   Senha: admin123');

  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createSimpleAdmin()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { createSimpleAdmin };
