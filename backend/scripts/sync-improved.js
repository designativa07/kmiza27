const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script de sincronização melhorado que lida com problemas específicos:
 * - JSON syntax errors
 * - Colunas geradas (goal_difference)
 * - Chaves duplicadas
 * - Constraints de chave estrangeira
 */

async function syncImproved() {
  console.log('🔄 Sincronização Melhorada - Produção → Desenvolvimento');
  console.log('======================================================');

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
    // Conectar aos bancos
    console.log('🔌 Conectando ao banco de produção...');
    await prodClient.connect();
    console.log('✅ Conectado à produção!');

    console.log('🔌 Conectando ao banco de desenvolvimento...');
    await devClient.connect();
    console.log('✅ Conectado ao desenvolvimento!');

    // 1. Limpeza prévia do banco de desenvolvimento
    console.log('🧹 Limpando banco de desenvolvimento...');
    await devClient.query('SET session_replication_role = replica;');
    
    const tablesToClean = [
      'pool_participants', 'pool_matches', 'match_broadcasts', 'goals', 'matches',
      'player_team_history', 'international_teams', 'competition_teams', 'pools',
      'users', 'teams', 'competitions', 'stadiums', 'players', 'rounds', 'channels', 'titles',
      'whatsapp_menu_configs', 'simulation_results', 'system_settings'
    ];

    for (const table of tablesToClean) {
      try {
        await devClient.query(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`✅ Limpo: ${table}`);
      } catch (error) {
        console.log(`⚠️  Erro ao limpar ${table}: ${error.message}`);
      }
    }

    // 2. Ordem de sincronização (respeitando dependências)
    const syncOrder = [
      'system_settings',
      'competitions',
      'teams', 
      'stadiums',
      'players',
      'rounds',
      'channels',
      'titles',
      'users',
      'matches',
      'goals',
      'competition_teams',
      'international_teams',
      'player_team_history',
      'pools',
      'pool_matches',
      'pool_participants',
      'match_broadcasts',
      'whatsapp_menu_configs',
      'simulation_results'
    ];

    let totalRows = 0;

    // 3. Sincronizar cada tabela na ordem correta
    for (const tableName of syncOrder) {
      try {
        console.log(`\n📋 Sincronizando: ${tableName}`);
        
        // Verificar se tabela existe na origem
        const tableExists = await prodClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);

        if (!tableExists.rows[0].exists) {
          console.log(`⚠️  Tabela ${tableName} não existe na origem, pulando...`);
          continue;
        }

        // Contar registros na origem
        const countResult = await prodClient.query(`SELECT COUNT(*) as count FROM "${tableName}";`);
        const sourceCount = parseInt(countResult.rows[0].count);
        
        if (sourceCount === 0) {
          console.log(`📭 Tabela ${tableName} está vazia na origem`);
          continue;
        }

        console.log(`📊 ${sourceCount} registros na origem`);

        // Buscar dados da origem
        const sourceData = await prodClient.query(`SELECT * FROM "${tableName}";`);
        
        if (sourceData.rows.length === 0) {
          console.log(`📭 Nenhum dado retornado para ${tableName}`);
          continue;
        }

        // Obter colunas da tabela de destino
        const targetColumns = await devClient.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `, [tableName]);

        const validColumns = targetColumns.rows.map(row => row.column_name);
        
        if (validColumns.length === 0) {
          console.log(`⚠️  Nenhuma coluna encontrada para ${tableName} no destino`);
          continue;
        }

        // Filtrar colunas problemáticas
        let filteredColumns = validColumns;
        
        // Remover colunas geradas
        if (tableName === 'competition_teams') {
          filteredColumns = filteredColumns.filter(col => col !== 'goal_difference');
        }

        // Preparar query de inserção
        const placeholders = filteredColumns.map((_, index) => `$${index + 1}`).join(', ');
        const insertQuery = `INSERT INTO "${tableName}" (${filteredColumns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders});`;

        let insertedCount = 0;
        let errorCount = 0;

        // Inserir dados em lotes
        const batchSize = 100;
        for (let i = 0; i < sourceData.rows.length; i += batchSize) {
          const batch = sourceData.rows.slice(i, i + batchSize);
          
          for (const row of batch) {
            try {
              // Preparar valores apenas com colunas válidas
              const values = filteredColumns.map(col => {
                const value = row[col];
                
                // Tratamento especial para campos JSON
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                  try {
                    return JSON.stringify(value);
                  } catch (error) {
                    console.log(`⚠️  Erro ao converter JSON em ${col}: ${error.message}`);
                    return '{}';
                  }
                } else if (Array.isArray(value)) {
                  try {
                    return JSON.stringify(value);
                  } catch (error) {
                    console.log(`⚠️  Erro ao converter array em ${col}: ${error.message}`);
                    return '[]';
                  }
                }
                
                return value;
              });

              await devClient.query(insertQuery, values);
              insertedCount++;
              
            } catch (error) {
              errorCount++;
              
              // Log apenas os primeiros erros
              if (errorCount <= 3) {
                console.log(`❌ Erro ao inserir em ${tableName}: ${error.message}`);
              }
              
              // Parar se muitos erros
              if (errorCount > 50) {
                console.log(`🛑 Muitos erros em ${tableName}, parando inserção`);
                break;
              }
            }
          }
          
          // Progresso para tabelas grandes
          if (sourceData.rows.length > 100) {
            const progress = Math.round((i / sourceData.rows.length) * 100);
            console.log(`⏳ ${tableName}: ${progress}% (${insertedCount} inseridos, ${errorCount} erros)`);
          }
        }

        console.log(`✅ ${tableName}: ${insertedCount} registros inseridos, ${errorCount} erros`);
        totalRows += insertedCount;

      } catch (error) {
        console.log(`💥 Erro ao sincronizar ${tableName}: ${error.message}`);
      }
    }

    // 4. Reabilitar constraints
    console.log('\n🔧 Reabilitando constraints...');
    await devClient.query('SET session_replication_role = DEFAULT;');
    console.log('✅ Constraints reabilitadas');

    // 5. Verificar integridade
    console.log('\n🔍 Verificando integridade...');
    const integrityCheck = await devClient.query(`
      SELECT 
        relname as tablename,
        n_tup_ins as inserts
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY n_tup_ins DESC;
    `);

    console.log('📊 Tabelas com dados:');
    integrityCheck.rows.forEach(row => {
      if (row.inserts > 0) {
        console.log(`  ${row.tablename}: ${row.inserts} registros`);
      }
    });

    console.log(`\n🎉 Sincronização concluída! Total: ${totalRows} registros inseridos`);

  } catch (error) {
    console.error('💥 Erro fatal durante sincronização:', error);
    throw error;
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  syncImproved()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { syncImproved };

