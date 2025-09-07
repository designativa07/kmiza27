const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para verificar os valores do enum
 */

async function checkEnumValues() {
  console.log('🔍 Verificando valores do enum...');

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

    // 1. Verificar valores do enum status
    console.log('\n📊 VALORES DO ENUM STATUS:');
    console.log('===========================');
    
    const enumValues = await devClient.query(`
      SELECT unnest(enum_range(NULL::match_status)) as status_value;
    `);
    
    console.log('Valores válidos do enum:');
    enumValues.rows.forEach(row => {
      console.log(`  - ${row.status_value}`);
    });

    // 2. Verificar valores atuais na tabela matches
    console.log('\n📊 VALORES ATUAIS NA TABELA MATCHES:');
    console.log('====================================');
    
    const currentValues = await devClient.query(`
      SELECT status, COUNT(*) as count 
      FROM matches 
      GROUP BY status 
      ORDER BY count DESC;
    `);
    
    currentValues.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} matches`);
    });

    // 3. Verificar valores na produção
    console.log('\n🔍 VERIFICANDO VALORES NA PRODUÇÃO:');
    console.log('===================================');
    
    // Configuração do banco de produção
    const prodClient = new Client({
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT,
      database: process.env.PROD_DB_DATABASE,
      user: process.env.PROD_DB_USERNAME,
      password: process.env.PROD_DB_PASSWORD,
    });

    try {
      await prodClient.connect();
      console.log('✅ Conectado à produção');

      // Verificar valores do enum na produção
      const prodEnumValues = await prodClient.query(`
        SELECT unnest(enum_range(NULL::match_status)) as status_value;
      `);
      
      console.log('Valores válidos do enum na produção:');
      prodEnumValues.rows.forEach(row => {
        console.log(`  - ${row.status_value}`);
      });

      // Verificar valores atuais na produção
      const prodCurrentValues = await prodClient.query(`
        SELECT status, COUNT(*) as count 
        FROM matches 
        GROUP BY status 
        ORDER BY count DESC;
      `);
      
      console.log('\nValores atuais na produção:');
      prodCurrentValues.rows.forEach(row => {
        console.log(`  ${row.status}: ${row.count} matches`);
      });

    } catch (prodError) {
      console.log('❌ Erro ao conectar à produção:', prodError.message);
    } finally {
      await prodClient.end();
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkEnumValues()
    .then(() => {
      console.log('\n✅ Verificação concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { checkEnumValues };

