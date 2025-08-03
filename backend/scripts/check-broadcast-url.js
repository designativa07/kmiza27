const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function checkBroadcastUrl() {
  try {
    await client.connect();
    console.log('🔍 Verificando estrutura da tabela match_broadcasts...');
    
    // Verificar colunas da tabela match_broadcasts
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'match_broadcasts'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Colunas da tabela match_broadcasts:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar se existe broadcast_url
    const hasBroadcastUrl = columns.rows.some(col => col.column_name === 'broadcast_url');
    console.log(`\n📺 Campo broadcast_url existe: ${hasBroadcastUrl ? 'SIM' : 'NÃO'}`);
    
    if (hasBroadcastUrl) {
      // Verificar alguns exemplos com broadcast_url
      const examples = await client.query(`
        SELECT mb.id, mb.match_id, c.name as channel_name, mb.broadcast_url
        FROM match_broadcasts mb
        LEFT JOIN channels c ON c.id = mb.channel_id
        WHERE mb.broadcast_url IS NOT NULL
        LIMIT 5
      `);
      
      console.log('\n📺 Exemplos com broadcast_url:');
      examples.rows.forEach(row => {
        console.log(`  - Match ${row.match_id}: ${row.channel_name} -> ${row.broadcast_url}`);
      });
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkBroadcastUrl();