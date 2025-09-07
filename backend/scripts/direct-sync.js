const { Client } = require('pg');

// Carregar variáveis de ambiente do arquivo correto
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

async function directSync() {
  // Configuração do banco de produção
  const prodClient = new Client({
    host: process.env.PROD_DB_HOST,
    port: process.env.PROD_DB_PORT,
    database: process.env.PROD_DB_DATABASE,
    user: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
  });

  // Configuração do banco de desenvolvimento
  const devClient = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    console.log('🔄 Sincronização Direta - Produção → Desenvolvimento');
    console.log('===================================================');

    // Conectar aos bancos
    console.log('🔌 Conectando ao banco de produção...');
    await prodClient.connect();
    console.log('✅ Conectado à produção!');

    console.log('🔌 Conectando ao banco de desenvolvimento...');
    await devClient.connect();
    console.log('✅ Conectado ao desenvolvimento!');

    // Desabilitar constraints temporariamente
    console.log('🔧 Desabilitando constraints...');
    await devClient.query('SET session_replication_role = replica;');
    console.log('✅ Constraints desabilitadas!');

    // Tabelas para sincronizar (ordem importante)
    const tables = [
      'system_settings',
      'competitions', 
      'teams',
      'stadiums',
      'players',
      'rounds',
      'users',
      'matches',
      'goals',
      'competition_teams',
      'simulation_results',
      'whatsapp_menu_configs'
    ];

    let totalRows = 0;

    for (const tableName of tables) {
      try {
        console.log(`\n📊 Sincronizando tabela: ${tableName}`);
        
        // 1. Contar registros na origem
        const countResult = await prodClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const sourceCount = parseInt(countResult.rows[0].count);
        console.log(`   📈 Origem: ${sourceCount} registros`);

        if (sourceCount === 0) {
          console.log(`   ⏭️  Tabela vazia, pulando...`);
          continue;
        }

        // 2. Limpar tabela destino
        await devClient.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
        console.log(`   🗑️  Tabela destino limpa`);

        // 3. Buscar dados da origem
        const sourceData = await prodClient.query(`SELECT * FROM "${tableName}"`);
        console.log(`   📥 ${sourceData.rows.length} registros carregados da origem`);

        if (sourceData.rows.length === 0) {
          console.log(`   ⏭️  Nenhum dado para copiar`);
          continue;
        }

        // 4. Obter colunas
        const columns = Object.keys(sourceData.rows[0]);
        console.log(`   📋 Colunas: ${columns.join(', ')}`);

        // 5. Inserir dados em lotes
        const batchSize = 100;
        let insertedRows = 0;

        for (let i = 0; i < sourceData.rows.length; i += batchSize) {
          const batch = sourceData.rows.slice(i, i + batchSize);
          
          for (const row of batch) {
            try {
              const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
              const insertQuery = `INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders})`;
              const values = columns.map(col => row[col]);
              
              await devClient.query(insertQuery, values);
              insertedRows++;
            } catch (error) {
              console.log(`   ❌ Erro ao inserir linha: ${error.message}`);
            }
          }
        }

        console.log(`   ✅ ${insertedRows} registros inseridos`);
        totalRows += insertedRows;

      } catch (error) {
        console.log(`   ❌ Erro na tabela ${tableName}: ${error.message}`);
      }
    }

    // Reabilitar constraints
    console.log('\n🔧 Reabilitando constraints...');
    await devClient.query('SET session_replication_role = DEFAULT;');
    console.log('✅ Constraints reabilitadas!');

    console.log('\n🎉 Sincronização concluída!');
    console.log(`📊 Total de registros copiados: ${totalRows}`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

directSync();

