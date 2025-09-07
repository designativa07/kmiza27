const { Client } = require('pg');

// Carregar variáveis de ambiente do arquivo correto
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

async function checkUsers() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    console.log('🔍 Verificando usuários no banco de desenvolvimento');
    console.log('==================================================');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    const result = await client.query(`
      SELECT id, email, name, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`\n📊 Total de usuários: ${result.rows.length}`);
    console.log('\n👥 Usuários encontrados:');
    result.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - Role: ${user.role}`);
    });

    // Verificar se há usuários admin
    const adminResult = await client.query(`
      SELECT id, email, name, role 
      FROM users 
      WHERE role = 'admin' OR role = 'ADMIN'
      ORDER BY created_at DESC
    `);
    
    console.log(`\n👑 Usuários admin: ${adminResult.rows.length}`);
    adminResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();

