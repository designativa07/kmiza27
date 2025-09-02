const { Client } = require('pg');

async function testLocalDatabases() {
  console.log('🔍 TESTANDO CONEXÕES COM BANCOS LOCAIS');
  console.log('========================================\n');

  const connectionConfigs = [
    // Configuração 1: postgres padrão
    {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
      ssl: false,
      description: 'postgres/postgres no banco postgres'
    },
    // Configuração 2: sem senha
    {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: '',
      database: 'postgres',
      ssl: false,
      description: 'postgres/sem senha no banco postgres'
    },
    // Configuração 3: senha comum
    {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'admin',
      database: 'postgres',
      ssl: false,
      description: 'postgres/admin no banco postgres'
    },
    // Configuração 4: usuário do sistema
    {
      host: 'localhost',
      port: 5432,
      user: process.env.USERNAME || 'postgres',
      password: '',
      database: 'postgres',
      ssl: false,
      description: `${process.env.USERNAME || 'postgres'}/sem senha no banco postgres`
    }
  ];

  for (let i = 0; i < connectionConfigs.length; i++) {
    const config = connectionConfigs[i];
    console.log(`\n🔍 Testando configuração ${i + 1}: ${config.description}`);
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log(`✅ Conexão bem-sucedida com ${config.description}`);
      
      // Listar bancos disponíveis
      const databases = await client.query(`
        SELECT datname 
        FROM pg_database 
        WHERE datistemplate = false 
        AND datname NOT IN ('postgres', 'template0', 'template1')
        ORDER BY datname
      `);
      
      console.log(`📊 Bancos disponíveis:`);
      if (databases.rows.length === 0) {
        console.log(`   Nenhum banco personalizado encontrado`);
      } else {
        databases.rows.forEach(db => {
          console.log(`   - ${db.datname}`);
        });
      }
      
      await client.end();
      console.log(`🔌 Conexão fechada`);
      
    } catch (error) {
      console.log(`❌ Falha na conexão: ${error.message}`);
    }
  }
}

// Executar o teste
testLocalDatabases();



