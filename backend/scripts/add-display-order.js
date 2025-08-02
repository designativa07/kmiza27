const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function addDisplayOrder() {
  try {
    console.log('🔧 Adicionando coluna display_order na tabela competitions...');
    
    await client.connect();
    
    // Verificar se a coluna já existe
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'competitions' AND column_name = 'display_order'
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Coluna display_order já existe');
      return;
    }
    
    // Adicionar a coluna
    const alterQuery = `
      ALTER TABLE competitions 
      ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0
    `;
    
    await client.query(alterQuery);
    console.log('✅ Coluna display_order adicionada');
    
    // Atualizar competições existentes
    const updateQuery = `
      UPDATE competitions 
      SET display_order = id 
      WHERE display_order = 0
    `;
    
    await client.query(updateQuery);
    console.log('✅ Competições existentes atualizadas');
    
    console.log('✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await client.end();
  }
}

addDisplayOrder(); 