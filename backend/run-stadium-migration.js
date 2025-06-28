const { Client } = require('pg');

async function runStadiumMigration() {
  const client = new Client({
    host: '195.200.0.191',
    port: 5433,
    user: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
    ssl: false
  });

  try {
    console.log('🔌 Conectando ao banco de dados de produção...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // SQL para adicionar as colunas de estádio
    const migrationSQL = `
      -- Adicionar novas colunas à tabela stadiums
      DO $$
      BEGIN
        -- Adicionar opened_year se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'stadiums' AND column_name = 'opened_year'
        ) THEN
          ALTER TABLE stadiums ADD COLUMN opened_year integer;
          RAISE NOTICE 'Coluna opened_year adicionada';
        END IF;

        -- Adicionar history se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'stadiums' AND column_name = 'history'
        ) THEN
          ALTER TABLE stadiums ADD COLUMN history text;
          RAISE NOTICE 'Coluna history adicionada';
        END IF;

        -- Adicionar image_url se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'stadiums' AND column_name = 'image_url'
        ) THEN
          ALTER TABLE stadiums ADD COLUMN image_url text;
          RAISE NOTICE 'Coluna image_url adicionada';
        END IF;
      END
      $$;
    `;

    console.log('📄 Executando migração dos estádios...');
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migração dos estádios executada com sucesso!');
    console.log('📋 Resultado:', result);

    // Verificar se as colunas foram adicionadas
    console.log('🔍 Verificando estrutura da tabela stadiums...');
    const checkResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stadiums' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Colunas da tabela stadiums:');
    checkResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

runStadiumMigration(); 