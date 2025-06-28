const { Client } = require('pg');

async function testPG17Connection() {
  const passwords = [
    'postgres',
    'admin',
    '123456',
    'password',
    '',
    '1234',
    'root',
    'Postgres123',
    'postgres123'
  ];

  console.log('🔍 Testando conexão com PostgreSQL 17 local...\n');

  for (const password of passwords) {
    console.log(`Testando senha: "${password || '(vazia)'}"`);
    
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: password,
      database: 'postgres', // Conectar no banco padrão primeiro
      ssl: false
    });
    
    try {
      await client.connect();
      console.log('   ✅ Conexão bem-sucedida!');
      
      // Verificar se o banco kmiza27_chatbot existe
      try {
        const dbCheck = await client.query(`
          SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE datname = 'kmiza27_chatbot');
        `);
        console.log(`   📊 Banco kmiza27_chatbot existe: ${dbCheck.rows[0].exists ? 'SIM' : 'NÃO'}`);
        
        if (!dbCheck.rows[0].exists) {
          console.log('   💡 Criando banco kmiza27_chatbot...');
          await client.query('CREATE DATABASE kmiza27_chatbot;');
          console.log('   ✅ Banco kmiza27_chatbot criado!');
        }
      } catch (e) {
        console.log(`   ❓ Erro ao verificar/criar banco: ${e.message}`);
      }
      
      await client.end();
      console.log('   🔌 Conexão fechada\n');
      
      return password; // Retorna a senha que funcionou
      
    } catch (error) {
      console.log(`   ❌ Falha: ${error.message}\n`);
      try {
        await client.end();
      } catch (e) {
        // Ignorar erros ao fechar
      }
    }
  }
  
  return null;
}

testPG17Connection()
  .then(password => {
    if (password !== null) {
      console.log(`✅ Senha encontrada: "${password || '(vazia)'}"`);
      console.log('Agora você pode usar esta senha para executar a migração.');
    } else {
      console.log('❌ Nenhuma senha funcionou.');
      console.log('💡 Talvez seja necessário redefinir a senha do PostgreSQL.');
    }
  })
  .catch(error => {
    console.error('❌ Erro geral:', error);
  }); 