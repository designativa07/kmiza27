const { Client } = require('pg');

const client = new Client({
  host: '195.200.0.191',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7'
});

async function fixUsersData() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao PostgreSQL');

    // Verificar dados atuais
    console.log('\n📊 Dados atuais dos usuários:');
    const currentUsers = await client.query('SELECT id, phone_number, name FROM users ORDER BY id');
    currentUsers.rows.forEach(user => {
      console.log(`ID ${user.id}: phone="${user.phone_number}", name="${user.name}"`);
    });

    // Corrigir usuário ID 4 (campos trocados)
    console.log('\n🔧 Corrigindo usuário ID 4...');
    await client.query(`
      UPDATE users 
      SET phone_number = '5548996652575', name = 'Teste'
      WHERE id = 4
    `);

    // Verificar dados após correção
    console.log('\n✅ Dados após correção:');
    const fixedUsers = await client.query('SELECT id, phone_number, name FROM users ORDER BY id');
    fixedUsers.rows.forEach(user => {
      console.log(`ID ${user.id}: phone="${user.phone_number}", name="${user.name}"`);
    });

    // Remover dados de teste se necessário
    console.log('\n🧹 Limpando dados de teste...');
    
    // Remover usuário de teste com phone "Teste"
    await client.query(`DELETE FROM users WHERE phone_number = 'Teste' OR name = 'Teste'`);
    
    // Verificar dados finais
    console.log('\n🎯 Dados finais dos usuários:');
    const finalUsers = await client.query(`
      SELECT id, phone_number, name, 
             CASE WHEN favorite_team_id IS NOT NULL THEN 
               (SELECT name FROM teams WHERE id = favorite_team_id) 
             ELSE NULL END as favorite_team_name,
             is_active, whatsapp_status, created_at
      FROM users 
      ORDER BY id
    `);
    
    finalUsers.rows.forEach(user => {
      console.log(`✅ ID ${user.id}: ${user.name || 'Sem nome'} (${user.phone_number}) - Time: ${user.favorite_team_name || 'Nenhum'} - Status: ${user.is_active ? 'Ativo' : 'Inativo'}`);
    });

    console.log(`\n🎉 Total de usuários válidos: ${finalUsers.rows.length}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

fixUsersData(); 