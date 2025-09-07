const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function checkSimple() {
  console.log('🔍 Verificação simples...');

  const devClient = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    await devClient.connect();
    console.log('✅ Conectado');

    // Verificar valores do enum
    const result = await devClient.query(`
      SELECT unnest(enum_range(NULL::match_status)) as status_value;
    `);
    
    console.log('Valores do enum:');
    result.rows.forEach(row => {
      console.log(`  - ${row.status_value}`);
    });

    // Verificar valores atuais
    const current = await devClient.query(`
      SELECT status, COUNT(*) as count 
      FROM matches 
      GROUP BY status 
      ORDER BY count DESC;
    `);
    
    console.log('\nValores atuais:');
    current.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    await devClient.end();
  }
}

checkSimple();

