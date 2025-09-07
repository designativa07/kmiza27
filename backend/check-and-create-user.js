const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para verificar e criar usuário admin se necessário
 */

async function checkAndCreateUser() {
  console.log('🔍 Verificando usuários no banco de desenvolvimento...');

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

    // 1. Verificar se há usuários
    const usersResult = await devClient.query('SELECT id, email, name, is_admin FROM users ORDER BY id;');
    console.log(`📊 Total de usuários encontrados: ${usersResult.rows.length}`);

    if (usersResult.rows.length > 0) {
      console.log('👥 Usuários existentes:');
      usersResult.rows.forEach(user => {
        console.log(`  ID: ${user.id}, Email: ${user.email}, Nome: ${user.name}, Admin: ${user.is_admin}`);
      });
    }

    // 2. Verificar se o usuário específico existe
    const specificUser = await devClient.query(
      'SELECT id, email, name, is_admin, is_active FROM users WHERE email = $1;',
      ['antonioddd48@gmail.com']
    );

    if (specificUser.rows.length > 0) {
      const user = specificUser.rows[0];
      console.log(`✅ Usuário encontrado: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Admin: ${user.is_admin}`);
      console.log(`   Ativo: ${user.is_active}`);
      
      if (!user.is_active) {
        console.log('⚠️  Usuário está inativo, ativando...');
        await devClient.query('UPDATE users SET is_active = true WHERE id = $1;', [user.id]);
        console.log('✅ Usuário ativado');
      }
    } else {
      console.log('❌ Usuário antonioddd48@gmail.com não encontrado');
      
      // 3. Criar usuário admin se não existir
      console.log('🔧 Criando usuário admin...');
      
      // Hash da senha @toni123 (você pode usar bcrypt para gerar um hash real)
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('@toni123', 10);
      
      const newUser = await devClient.query(`
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
        '5511999999999', // Número de telefone padrão
        'antonioddd48@gmail.com',
        hashedPassword,
        'Antonio Admin',
        true,
        true,
        'admin',
        'manual',
        'active'
      ]);
      
      console.log('✅ Usuário admin criado com sucesso:');
      console.log(`   ID: ${newUser.rows[0].id}`);
      console.log(`   Email: ${newUser.rows[0].email}`);
      console.log(`   Nome: ${newUser.rows[0].name}`);
      console.log(`   Admin: ${newUser.rows[0].is_admin}`);
    }

    // 4. Verificar se há pelo menos um usuário admin
    const adminUsers = await devClient.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true AND is_active = true;');
    const adminCount = parseInt(adminUsers.rows[0].count);
    
    console.log(`👑 Usuários admin ativos: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('⚠️  Nenhum usuário admin ativo encontrado!');
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkAndCreateUser()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { checkAndCreateUser };
