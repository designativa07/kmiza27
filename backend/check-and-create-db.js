const { Client } = require('pg');

async function checkAndCreateDatabase() {
  console.log('🔍 Verificando se o banco kmiza27_dev existe...');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Verificar se o banco existe
    const result = await client.query(
      'SELECT datname FROM pg_database WHERE datname = $1', 
      ['kmiza27_dev']
    );

    if (result.rows.length === 0) {
      console.log('📝 Banco kmiza27_dev não existe. Criando...');
      await client.query('CREATE DATABASE kmiza27_dev');
      console.log('✅ Banco kmiza27_dev criado com sucesso!');
    } else {
      console.log('✅ Banco kmiza27_dev já existe');
    }

    // Verificar tabelas no banco kmiza27_dev
    console.log('\n🔍 Verificando tabelas no banco kmiza27_dev...');
    const tableClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'kmiza27_dev'
    });

    await tableClient.connect();
    const tables = await tableClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log(`📊 Encontradas ${tables.rows.length} tabelas:`);
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    await tableClient.end();

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkAndCreateDatabase();

