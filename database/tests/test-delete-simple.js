const { Client } = require('pg');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

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

    // 2. Verificar usuários antes da exclusão
    console.log('\n📊 Usuários antes da exclusão:');
    const beforeUsers = await client.query('SELECT id, phone_number, name FROM users ORDER BY id');
    beforeUsers.rows.forEach(user => {
      console.log(`ID ${user.id}: ${user.name} (${user.phone_number})`);
    });
    console.log(`Total: ${beforeUsers.rows.length} usuários`);

    // 3. Testar exclusão via curl
    console.log(`\n🗑️ Testando exclusão do usuário ID ${testUser.id} via API...`);
    
    try {
      const { stdout, stderr } = await execAsync(`curl -X DELETE http://localhost:3000/users/${testUser.id}`);
      console.log('📊 Resposta da API:', stdout);
      if (stderr) console.log('⚠️ Stderr:', stderr);
    } catch (error) {
      console.log('❌ Erro na requisição curl:', error.message);
    }

    // 4. Verificar usuários após exclusão
    console.log('\n📊 Usuários após exclusão:');
    const afterUsers = await client.query('SELECT id, phone_number, name FROM users ORDER BY id');
    afterUsers.rows.forEach(user => {
      console.log(`ID ${user.id}: ${user.name} (${user.phone_number})`);
    });
    console.log(`Total: ${afterUsers.rows.length} usuários`);
    
    // 5. Verificar resultado
    if (afterUsers.rows.length === beforeUsers.rows.length - 1) {
      console.log('\n🎉 SUCESSO: Usuário foi excluído corretamente!');
    } else {
      console.log('\n❌ ERRO: Usuário não foi excluído!');
      
      // Limpar manualmente se necessário
      console.log('\n🧹 Limpando usuário de teste manualmente...');
      await client.query('DELETE FROM users WHERE phone_number = $1', ['5511000000000']);
      console.log('✅ Usuário de teste removido manualmente');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

testDeleteUser(); 