const { Client } = require('pg');

// Carregar variáveis de ambiente do arquivo correto
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

async function syncWithCorrectOrder() {
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
    console.log('🔄 Sincronização com Ordem Correta de Dependências');
    console.log('=================================================');

    // Conectar aos bancos
    console.log('🔌 Conectando aos bancos...');
    await prodClient.connect();
    await devClient.connect();
    console.log('✅ Conectado com sucesso!');

    // Desabilitar constraints temporariamente
    console.log('🔧 Desabilitando constraints...');
    await devClient.query('SET session_replication_role = replica;');
    console.log('✅ Constraints desabilitadas!');

    // Ordem correta de sincronização (respeitando dependências)
    const syncOrder = [
      'system_settings',
      'competitions', 
      'teams',           // PRIMEIRO: times devem vir antes das partidas
      'stadiums',
      'players',
      'rounds',
      'users',
      'competition_teams', // SEGUNDO: times de competição
      'matches',          // TERCEIRO: partidas (dependem de teams)
      'goals',            // QUARTO: gols (dependem de matches)
      'simulation_results',
      'whatsapp_menu_configs'
    ];

    let totalRows = 0;

    for (const tableName of syncOrder) {
      try {
        console.log(`\n📊 Sincronizando: ${tableName}`);
        
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
        console.log(`   📥 ${sourceData.rows.length} registros carregados`);

        if (sourceData.rows.length === 0) {
          console.log(`   ⏭️  Nenhum dado para copiar`);
          continue;
        }

        // 4. Obter colunas
        const columns = Object.keys(sourceData.rows[0]);
        console.log(`   📋 ${columns.length} colunas: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);

        // 5. Inserir dados em lotes
        const batchSize = 100;
        let insertedRows = 0;
        let errors = 0;

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
              errors++;
              if (errors <= 3) {
                console.log(`   ❌ Erro na linha ${i + 1}: ${error.message}`);
              }
            }
          }
        }

        console.log(`   ✅ ${insertedRows} registros inseridos${errors > 0 ? ` (${errors} erros)` : ''}`);
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

    // Verificar resultado final
    console.log('\n🔍 Verificando resultado final:');
    const finalCheck = await devClient.query(`
      SELECT 
        (SELECT COUNT(*) FROM matches) as matches,
        (SELECT COUNT(*) FROM teams) as teams,
        (SELECT COUNT(*) FROM competition_teams) as competition_teams,
        (SELECT COUNT(*) FROM simulation_results) as simulation_results
    `);
    
    const result = finalCheck.rows[0];
    console.log(`   matches: ${result.matches}`);
    console.log(`   teams: ${result.teams}`);
    console.log(`   competition_teams: ${result.competition_teams}`);
    console.log(`   simulation_results: ${result.simulation_results}`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

syncWithCorrectOrder();

