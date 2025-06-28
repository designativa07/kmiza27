const { Client } = require('pg');

async function runStadiumMigrationLocalhost() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USERNAME || 'devuser',
    password: process.env.DATABASE_PASSWORD || 'devuser',
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    ssl: false
  });

  try {
    console.log('🔌 Conectando ao banco de dados LOCAL (localhost)...');
    await client.connect();
    console.log('✅ Conectado com sucesso no PostgreSQL local!');

    // Verificar se a tabela stadiums existe
    console.log('🔍 Verificando se a tabela stadiums existe...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stadiums'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela stadiums não existe no banco local!');
      console.log('💡 Você precisa primeiro executar as migrações básicas no banco local.');
      return;
    }

    console.log('✅ Tabela stadiums encontrada!');

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
        ELSE
          RAISE NOTICE 'Coluna opened_year já existe';
        END IF;

        -- Adicionar history se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'stadiums' AND column_name = 'history'
        ) THEN
          ALTER TABLE stadiums ADD COLUMN history text;
          RAISE NOTICE 'Coluna history adicionada';
        ELSE
          RAISE NOTICE 'Coluna history já existe';
        END IF;

        -- Adicionar image_url se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'stadiums' AND column_name = 'image_url'
        ) THEN
          ALTER TABLE stadiums ADD COLUMN image_url text;
          RAISE NOTICE 'Coluna image_url adicionada';
        ELSE
          RAISE NOTICE 'Coluna image_url já existe';
        END IF;
      END
      $$;
    `;

    console.log('📄 Executando migração dos estádios no banco LOCAL...');
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migração dos estádios executada com sucesso!');

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

    // Verificar se as colunas específicas existem
    const specificColumns = ['opened_year', 'history', 'image_url'];
    console.log('\n🎯 Verificando colunas específicas:');
    
    for (const column of specificColumns) {
      const exists = checkResult.rows.some(row => row.column_name === column);
      console.log(`  - ${column}: ${exists ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
    }

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Dica: Certifique-se de que o PostgreSQL está rodando localmente na porta 5432');
    } else if (error.code === '28P01') {
      console.log('💡 Dica: Verifique se a senha do PostgreSQL local está correta');
    } else if (error.code === '3D000') {
      console.log('💡 Dica: O banco de dados "kmiza27" não existe no PostgreSQL local');
    }
  } finally {
    try {
      await client.end();
      console.log('🔌 Conexão fechada');
    } catch (e) {
      // Ignorar erros ao fechar conexão
    }
  }
}

runStadiumMigrationLocalhost(); 