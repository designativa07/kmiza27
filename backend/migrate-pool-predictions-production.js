const { Client } = require('pg');

async function migratePoolPredictionsProduction() {
  // Configuração para produção - ajuste conforme necessário
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'kmiza27_prod', // Ajuste para o nome do banco de produção
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados de produção');

    // 1. Verificar estrutura atual
    console.log('\n1. Verificando estrutura atual...');
    const currentStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'pool_predictions'
      ORDER BY ordinal_position;
    `);
    
    console.log('Estrutura atual:');
    currentStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // 2. Adicionar colunas que estão faltando
    console.log('\n2. Adicionando colunas necessárias...');
    
    const addColumnsQueries = [
      'ALTER TABLE pool_predictions ADD COLUMN IF NOT EXISTS predicted_home_score INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE pool_predictions ADD COLUMN IF NOT EXISTS predicted_away_score INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE pool_predictions ADD COLUMN IF NOT EXISTS prediction_type VARCHAR(50) NULL'
    ];

    for (const query of addColumnsQueries) {
      await client.query(query);
      console.log('✅ Executado:', query);
    }

    // 3. Migrar dados das colunas antigas (se existirem)
    console.log('\n3. Migrando dados das colunas antigas...');
    
    const checkOldColumns = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'pool_predictions'
      AND column_name IN ('home_score', 'away_score');
    `);
    
    if (parseInt(checkOldColumns.rows[0].count) > 0) {
      console.log('⚠️ Detectadas colunas antigas. Migrando dados...');
      
      await client.query(`
        UPDATE pool_predictions 
        SET 
          predicted_home_score = COALESCE(home_score, 0),
          predicted_away_score = COALESCE(away_score, 0)
        WHERE predicted_home_score = 0 AND predicted_away_score = 0
        AND (home_score IS NOT NULL OR away_score IS NOT NULL);
      `);
      
      console.log('✅ Dados migrados das colunas antigas');
      
      // Remover colunas antigas
      await client.query('ALTER TABLE pool_predictions DROP COLUMN IF EXISTS home_score');
      await client.query('ALTER TABLE pool_predictions DROP COLUMN IF EXISTS away_score');
      console.log('✅ Colunas antigas removidas');
    } else {
      console.log('✅ Não há colunas antigas para migrar');
    }

    // 4. Verificar estrutura final
    console.log('\n4. Verificando estrutura final...');
    const finalStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'pool_predictions'
      ORDER BY ordinal_position;
    `);
    
    console.log('Estrutura final:');
    finalStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // 5. Verificar se há dados na tabela
    console.log('\n5. Verificando dados existentes...');
    const dataCount = await client.query('SELECT COUNT(*) as count FROM pool_predictions');
    console.log(`Total de registros na tabela: ${dataCount.rows[0].count}`);

    console.log('\n✅ Migração concluída com sucesso!');
    console.log('O sistema de pontuação automática agora deve funcionar corretamente.');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar migração
migratePoolPredictionsProduction(); 