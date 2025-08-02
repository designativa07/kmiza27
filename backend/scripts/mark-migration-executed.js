const { Client } = require('pg');

async function markMigrationExecuted() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'devuser',
    password: 'devuser',
    database: 'kmiza27_dev'
  });

  try {
    await client.connect();
    console.log('🔗 Conectado ao banco de dados');

    // Verificar se a tabela migrations existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('ℹ️ Tabela migrations não existe. Tentando criar...');
      try {
        await client.query(`
          CREATE TABLE migrations (
            id SERIAL NOT NULL,
            timestamp bigint NOT NULL,
            name character varying NOT NULL,
            CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id)
          );
        `);
        console.log('✅ Tabela migrations criada com sucesso');
      } catch (createError) {
        console.log('⚠️ Não foi possível criar a tabela migrations:', createError.message);
        console.log('ℹ️ Tentando inserir diretamente na tabela existente...');
      }
    } else {
      console.log('✅ Tabela migrations já existe');
    }

    // Verificar se a migration já foi executada
    const migrationExists = await client.query(`
      SELECT * FROM migrations WHERE name = 'AddAliasesToTeams1749307697420';
    `);

    if (migrationExists.rows.length === 0) {
      console.log('✅ Marcando migration como executada...');
      await client.query(`
        INSERT INTO migrations (timestamp, name) 
        VALUES (1749307697420, 'AddAliasesToTeams1749307697420');
      `);
      console.log('✅ Migration marcada como executada com sucesso!');
    } else {
      console.log('ℹ️ Migration já estava marcada como executada');
    }

    // Verificar se a coluna aliases existe
    const columnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'aliases';
    `);

    if (columnExists.rows.length > 0) {
      console.log('✅ Coluna aliases existe na tabela teams');
    } else {
      console.log('❌ Coluna aliases não encontrada na tabela teams');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Desconectado do banco de dados');
  }
}

markMigrationExecuted(); 