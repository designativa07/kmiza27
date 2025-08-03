const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function removeBroadcastUrlField() {
  try {
    await client.connect();
    console.log('🔍 Removendo campo broadcast_url...');
    
    // Verificar se a coluna existe
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'match_broadcasts' 
        AND column_name = 'broadcast_url'
      );
    `);
    
    if (columnExists.rows[0].exists) {
      // Remover a coluna
      await client.query(`
        ALTER TABLE match_broadcasts 
        DROP COLUMN broadcast_url;
      `);
      
      console.log('✅ Campo broadcast_url removido com sucesso!');
    } else {
      console.log('ℹ️ Campo broadcast_url não existe na tabela');
    }
    
    // Verificar a estrutura final
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'match_broadcasts'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estrutura final da tabela match_broadcasts:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

removeBroadcastUrlField();