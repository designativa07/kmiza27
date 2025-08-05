const { Client } = require('pg');

async function fixPoolPredictionsPredictedAt() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'kmiza27_dev',
    user: 'admin',
    password: 'password'
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Verificar se a coluna predicted_at existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pool_predictions' 
      AND column_name = 'predicted_at'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('Adicionando coluna predicted_at...');
      
      // Adicionar a coluna predicted_at
      await client.query(`
        ALTER TABLE pool_predictions 
        ADD COLUMN predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      
      console.log('✅ Coluna predicted_at adicionada com sucesso!');
    } else {
      console.log('✅ Coluna predicted_at já existe');
    }

    // Verificar se a coluna updated_at existe
    const checkUpdatedAt = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pool_predictions' 
      AND column_name = 'updated_at'
    `);

    if (checkUpdatedAt.rows.length === 0) {
      console.log('Adicionando coluna updated_at...');
      
      // Adicionar a coluna updated_at
      await client.query(`
        ALTER TABLE pool_predictions 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      
      console.log('✅ Coluna updated_at adicionada com sucesso!');
    } else {
      console.log('✅ Coluna updated_at já existe');
    }

    // Verificar estrutura atual da tabela
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pool_predictions'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Estrutura atual da tabela pool_predictions:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${row.column_default ? `default: ${row.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixPoolPredictionsPredictedAt(); 