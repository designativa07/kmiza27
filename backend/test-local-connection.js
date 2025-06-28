const { Client } = require('pg');

async function testLocalConnection() {
  const connectionConfigs = [
    // Configuração 1: senha padrão
    {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'kmiza27',
      ssl: false,
      description: 'postgres/postgres'
    },
    // Configuração 2: sem senha
    {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: '',
      database: 'kmiza27',
      ssl: false,
      description: 'postgres/sem senha'
    },
    // Configuração 3: senha comum
    {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'admin',
      database: 'kmiza27',
      ssl: false,
      description: 'postgres/admin'
    },
    // Configuração 4: usuário padrão do sistema
    {
      host: 'localhost',
      port: 5432,
      user: process.env.USERNAME || 'postgres',
      password: '',
      database: 'kmiza27',
      ssl: false,
      description: `${process.env.USERNAME || 'postgres'}/sem senha`
    },
    // Configuração 5: banco postgres padrão
    {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
      ssl: false,
      description: 'postgres/postgres no banco postgres'
    }
  ];

  console.log('🔍 Testando conexões com PostgreSQL local...\n');

  for (let i = 0; i < connectionConfigs.length; i++) {
    const config = connectionConfigs[i];
    console.log(`${i + 1}. Testando: ${config.description}`);
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log(`   ✅ Conexão bem-sucedida!`);
      
      // Testar se o banco kmiza27 existe
      if (config.database === 'postgres') {
        try {
          const dbCheck = await client.query(`
            SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE datname = 'kmiza27');
          `);
          console.log(`   📊 Banco kmiza27 existe: ${dbCheck.rows[0].exists ? 'SIM' : 'NÃO'}`);
        } catch (e) {
          console.log(`   ❓ Erro ao verificar banco kmiza27: ${e.message}`);
        }
      } else {
        // Testar se a tabela stadiums existe
        try {
          const tableCheck = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'stadiums'
            );
          `);
          console.log(`   📊 Tabela stadiums existe: ${tableCheck.rows[0].exists ? 'SIM' : 'NÃO'}`);
        } catch (e) {
          console.log(`   ❓ Erro ao verificar tabela stadiums: ${e.message}`);
        }
      }
      
      await client.end();
      console.log(`   🔌 Conexão fechada\n`);
      
      // Se chegou até aqui, encontramos uma conexão válida
      return config;
      
    } catch (error) {
      console.log(`   ❌ Falha: ${error.message}\n`);
      try {
        await client.end();
      } catch (e) {
        // Ignorar erros ao fechar
      }
    }
  }
  
  console.log('❌ Nenhuma configuração de conexão funcionou.');
  console.log('💡 Possíveis soluções:');
  console.log('   1. Instalar PostgreSQL localmente');
  console.log('   2. Criar o banco de dados "kmiza27" localmente');
  console.log('   3. Configurar o .env para usar o banco remoto em desenvolvimento');
  
  return null;
}

testLocalConnection()
  .then(config => {
    if (config) {
      console.log('✅ Configuração de conexão válida encontrada:');
      console.log(JSON.stringify(config, null, 2));
    }
  })
  .catch(error => {
    console.error('❌ Erro geral:', error);
  }); 