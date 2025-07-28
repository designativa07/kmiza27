const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkAmateurData() {
  try {
    console.log('Verificando dados amadores...');
    
    // Verificar competições amadoras
    const competitionsResult = await pool.query(`
      SELECT id, name, slug, logo_url, category, is_active, created_at 
      FROM competitions 
      WHERE category = 'amateur'
      ORDER BY created_at DESC
    `);
    
    console.log('\n=== COMPETIÇÕES AMADORAS ===');
    console.log(`Total encontrado: ${competitionsResult.rows.length}`);
    
    competitionsResult.rows.forEach((comp, index) => {
      console.log(`${index + 1}. ID: ${comp.id}`);
      console.log(`   Nome: ${comp.name}`);
      console.log(`   Slug: ${comp.slug}`);
      console.log(`   Logo URL: ${comp.logo_url || 'null'}`);
      console.log(`   Categoria: ${comp.category}`);
      console.log(`   Ativa: ${comp.is_active}`);
      console.log(`   Criada em: ${comp.created_at}`);
      console.log('');
    });
    
    // Verificar times amadores
    const teamsResult = await pool.query(`
      SELECT id, name, slug, logo_url, category, created_at 
      FROM teams 
      WHERE category = 'amateur'
      ORDER BY created_at DESC
    `);
    
    console.log('\n=== TIMES AMADORES ===');
    console.log(`Total encontrado: ${teamsResult.rows.length}`);
    
    teamsResult.rows.forEach((team, index) => {
      console.log(`${index + 1}. ID: ${team.id}`);
      console.log(`   Nome: ${team.name}`);
      console.log(`   Slug: ${team.slug}`);
      console.log(`   Logo URL: ${team.logo_url || 'null'}`);
      console.log(`   Categoria: ${team.category}`);
      console.log(`   Criado em: ${team.created_at}`);
      console.log('');
    });
    
    // Verificar usuários amadores
    const usersResult = await pool.query(`
      SELECT id, email, role, created_at 
      FROM users 
      WHERE role = 'amateur'
      ORDER BY created_at DESC
    `);
    
    console.log('\n=== USUÁRIOS AMADORES ===');
    console.log(`Total encontrado: ${usersResult.rows.length}`);
    
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Criado em: ${user.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
  } finally {
    await pool.end();
  }
}

checkAmateurData(); 