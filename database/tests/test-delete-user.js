const { Client } = require('pg');

const client = new Client({
  host: '195.200.0.191',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7'
});

async function testDeleteUser() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao PostgreSQL');

    // 1. Criar usuário de teste
    console.log('\n➕ Criando usuário de teste...');
    const insertResult = await client.query(`
      INSERT INTO users (phone_number, name, is_active, whatsapp_status, preferences)
      VALUES ('5511000000000', 'Usuário Teste', true, 'active', '{"language": "pt-BR", "notifications": true}')
      RETURNING id, phone_number, name
    `);
    
    const testUser = insertResult.rows[0];
    console.log(`✅ Usuário criado: ID ${testUser.id} - ${testUser.name} (${testUser.phone_number})`);

    // 2. Verificar se foi criado
    console.log('\n📊 Usuários atuais:');
    const allUsers = await client.query('SELECT id, phone_number, name FROM users ORDER BY id');
    allUsers.rows.forEach(user => {
      console.log(`ID ${user.id}: ${user.name} (${user.phone_number})`);
    });

    console.log(`\n🎯 Total de usuários: ${allUsers.rows.length}`);
    console.log(`\n⏳ Aguardando 3 segundos antes de testar a exclusão via API...`);
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Testar exclusão via API
    console.log(`\n🗑️ Testando exclusão do usuário ID ${testUser.id} via API...`);
    
    // Simular requisição DELETE
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`http://localhost:3000/users/${testUser.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Status da requisição DELETE: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Resposta da API:`, result);
    } else {
      console.log(`❌ Erro na requisição: ${response.statusText}`);
    }

    // 4. Verificar se foi excluído
    console.log('\n📊 Usuários após exclusão:');
    const finalUsers = await client.query('SELECT id, phone_number, name FROM users ORDER BY id');
    finalUsers.rows.forEach(user => {
      console.log(`ID ${user.id}: ${user.name} (${user.phone_number})`);
    });

    console.log(`\n🎯 Total de usuários final: ${finalUsers.rows.length}`);
    
    if (finalUsers.rows.length === allUsers.rows.length - 1) {
      console.log('🎉 SUCESSO: Usuário foi excluído corretamente!');
    } else {
      console.log('❌ ERRO: Usuário não foi excluído!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

testDeleteUser(); 