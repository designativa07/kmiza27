const { Client } = require('pg');

async function testDevUserConnection() {
  console.log('🔍 Testando conexão com usuário devuser...\n');

  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'devuser',
    password: 'devuser',
    database: 'postgres', // Conectar no banco padrão primeiro
    ssl: false
  });
  
  try {
    await client.connect();
    console.log('✅ Conexão bem-sucedida com devuser!');
    
    // Verificar se o banco kmiza27_chatbot existe
    try {
      const dbCheck = await client.query(`
        SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE datname = 'kmiza27_chatbot');
      `);
      console.log(`📊 Banco kmiza27_chatbot existe: ${dbCheck.rows[0].exists ? 'SIM' : 'NÃO'}`);
      
      if (!dbCheck.rows[0].exists) {
        console.log('💡 Criando banco kmiza27_chatbot...');
        await client.query('CREATE DATABASE kmiza27_chatbot;');
        console.log('✅ Banco kmiza27_chatbot criado!');
      }
    } catch (e) {
      console.log(`❓ Erro ao verificar/criar banco: ${e.message}`);
    }
    
    await client.end();
    console.log('🔌 Conexão fechada\n');
    
    // Agora testar conexão direta no banco kmiza27_chatbot
    console.log('🔍 Testando conexão direta no banco kmiza27_chatbot...');
    
    const clientChatbot = new Client({
      host: 'localhost',
      port: 5432,
      user: 'devuser',
      password: 'devuser',
      database: 'kmiza27_chatbot',
      ssl: false
    });
    
    try {
      await clientChatbot.connect();
      console.log('✅ Conexão bem-sucedida no banco kmiza27_chatbot!');
      
      // Verificar se a tabela stadiums existe
      const tableCheck = await clientChatbot.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'stadiums'
        );
      `);
      console.log(`📊 Tabela stadiums existe: ${tableCheck.rows[0].exists ? 'SIM' : 'NÃO'}`);
      
      if (tableCheck.rows[0].exists) {
        // Verificar colunas da tabela stadiums
        const columnsCheck = await clientChatbot.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'stadiums' 
          ORDER BY ordinal_position;
        `);
        console.log('📊 Colunas da tabela stadiums:');
        columnsCheck.rows.forEach(row => {
          console.log(`  - ${row.column_name}`);
        });
      }
      
      await clientChatbot.end();
      console.log('🔌 Conexão fechada');
      
      return true;
      
    } catch (e) {
      console.log(`❌ Erro no banco kmiza27_chatbot: ${e.message}`);
      try {
        await clientChatbot.end();
      } catch (err) {
        // Ignorar
      }
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Falha na conexão: ${error.message}`);
    try {
      await client.end();
    } catch (e) {
      // Ignorar erros ao fechar
    }
    return false;
  }
}

testDevUserConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Configuração de banco local encontrada!');
      console.log('Usuário: devuser');
      console.log('Senha: devuser');
      console.log('Banco: kmiza27_chatbot');
    } else {
      console.log('\n❌ Não foi possível conectar ao banco local.');
    }
  })
  .catch(error => {
    console.error('❌ Erro geral:', error);
  }); 