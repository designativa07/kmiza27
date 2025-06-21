const { Client } = require('pg');

async function removeStreamingLinksColumn() {
  console.log('🚀 Iniciando script para remover coluna streaming_links...');
  
  const client = new Client({
    connectionString: 'postgres://devuser:devpass123@localhost:5432/kmiza27_dev'
  });

  try {
    console.log('🔌 Tentando conectar ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado ao banco de dados com sucesso!');

    // Verificar se a coluna existe
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'matches' AND column_name = 'streaming_links'
    `);

    if (checkResult.rows.length > 0) {
      console.log('📋 Coluna streaming_links encontrada, removendo...');
      
      // Remover a coluna
      await client.query('ALTER TABLE matches DROP COLUMN streaming_links');
      
      console.log('✅ Coluna streaming_links removida com sucesso!');
    } else {
      console.log('ℹ️ Coluna streaming_links não encontrada (já foi removida)');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

removeStreamingLinksColumn(); 