const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para corrigir erros de JSON na tabela matches
 */

async function fixJsonErrors() {
  console.log('🔧 Corrigindo erros de JSON na tabela matches...');

  // Configuração do banco de desenvolvimento
  const devClient = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    await devClient.connect();
    console.log('✅ Conectado ao banco de desenvolvimento');

    // 1. Limpar tabela matches
    console.log('🧹 Limpando tabela matches...');
    await devClient.query('TRUNCATE TABLE matches CASCADE;');
    console.log('✅ Tabela matches limpa');

    // 2. Conectar à produção
    const prodClient = new Client({
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT,
      database: process.env.PROD_DB_DATABASE,
      user: process.env.PROD_DB_USERNAME,
      password: process.env.PROD_DB_PASSWORD,
    });

    await prodClient.connect();
    console.log('✅ Conectado à produção');

    // 3. Buscar dados da produção
    console.log('📥 Buscando dados da produção...');
    const sourceData = await prodClient.query('SELECT * FROM matches ORDER BY id;');
    console.log(`📊 ${sourceData.rows.length} registros encontrados`);

    // 4. Obter colunas da tabela de destino
    const targetColumns = await devClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'matches' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    const validColumns = targetColumns.rows.map(row => row.column_name);
    const filteredColumns = validColumns.filter(col => col !== 'goal_difference');
    console.log(`📋 Colunas válidas: ${filteredColumns.length}`);

    // 5. Processar cada match com tratamento robusto de JSON
    let processedCount = 0;
    let errorCount = 0;
    const batchSize = 100;

    const placeholders = filteredColumns.map((_, index) => `$${index + 1}`).join(', ');
    const insertQuery = `INSERT INTO matches (${filteredColumns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders});`;

    for (let i = 0; i < sourceData.rows.length; i += batchSize) {
      const batch = sourceData.rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          // Preparar valores com tratamento especial para JSON
          const values = filteredColumns.map(col => {
            const value = row[col];
            
            // Tratamento especial para campos JSON
            const jsonFields = ['broadcast_channels', 'match_stats', 'home_team_player_stats', 'away_team_player_stats'];
            
            if (jsonFields.includes(col)) {
              if (value === null || value === undefined) {
                return null;
              }
              
              if (typeof value === 'string') {
                // Se já é string, verificar se é JSON válido
                try {
                  JSON.parse(value);
                  return value;
                } catch (e) {
                  // Se não é JSON válido, retornar array vazio ou objeto vazio
                  if (col === 'broadcast_channels') {
                    return '[]';
                  } else {
                    return '{}';
                  }
                }
              }
              
              if (Array.isArray(value)) {
                try {
                  return JSON.stringify(value);
                } catch (e) {
                  return '[]';
                }
              }
              
              if (typeof value === 'object') {
                try {
                  return JSON.stringify(value);
                } catch (e) {
                  return '{}';
                }
              }
              
              return value;
            }
            
            // Tratamento especial para status
            if (col === 'status') {
              const statusMap = {
                'to_confirm': 'scheduled',
                'confirmed': 'scheduled',
                'in_progress': 'live',
                'completed': 'finished',
                'finished': 'finished',
                'postponed': 'postponed',
                'cancelled': 'cancelled'
              };
              
              if (value && statusMap[value]) {
                return statusMap[value];
              } else if (value && !['scheduled', 'live', 'finished', 'postponed', 'cancelled'].includes(value)) {
                return 'scheduled';
              }
              
              return value;
            }
            
            // Para outros campos, retornar como está
            return value;
          });

          await devClient.query(insertQuery, values);
          processedCount++;
          
        } catch (error) {
          errorCount++;
          
          // Log apenas os primeiros erros
          if (errorCount <= 5) {
            console.log(`❌ Erro ao inserir match ${row.id}: ${error.message}`);
          }
          
          // Parar se muitos erros
          if (errorCount > 100) {
            console.log(`🛑 Muitos erros, parando processamento`);
            break;
          }
        }
      }
      
      // Progresso
      const progress = Math.round((i / sourceData.rows.length) * 100);
      console.log(`⏳ Progresso: ${progress}% (${processedCount} processados, ${errorCount} erros)`);
    }

    console.log(`\n✅ Processamento concluído!`);
    console.log(`📊 ${processedCount} registros inseridos`);
    console.log(`❌ ${errorCount} erros encontrados`);

    // 6. Verificar resultado
    const result = await devClient.query('SELECT COUNT(*) as count FROM matches;');
    console.log(`📊 Total de registros na tabela matches: ${result.rows[0].count}`);

    await prodClient.end();

  } catch (error) {
    console.error('💥 Erro fatal:', error);
    throw error;
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixJsonErrors()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixJsonErrors };

