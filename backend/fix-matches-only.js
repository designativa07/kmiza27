const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script específico para corrigir apenas a tabela matches
 */

async function fixMatchesOnly() {
  console.log('🔧 Corrigindo apenas a tabela matches...');

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
    console.log('🔌 Conectando aos bancos...');
    await prodClient.connect();
    await devClient.connect();
    console.log('✅ Conectado!');

    // 1. Limpar tabela matches no desenvolvimento
    console.log('🧹 Limpando tabela matches...');
    await devClient.query('TRUNCATE TABLE matches CASCADE;');
    console.log('✅ Tabela matches limpa');

    // 2. Buscar dados da produção
    console.log('📥 Buscando dados da produção...');
    const sourceData = await prodClient.query('SELECT * FROM matches ORDER BY id;');
    console.log(`📊 ${sourceData.rows.length} registros encontrados`);

    // 3. Obter colunas da tabela de destino
    const targetColumns = await devClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'matches' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    const validColumns = targetColumns.rows.map(row => row.column_name);
    console.log(`📋 Colunas válidas: ${validColumns.length}`);

    // 4. Filtrar colunas problemáticas
    const filteredColumns = validColumns.filter(col => col !== 'goal_difference');
    console.log(`📋 Colunas filtradas: ${filteredColumns.length}`);

    // 5. Verificar se teams existem
    const teamIds = await devClient.query('SELECT id FROM teams');
    const validTeamIds = new Set(teamIds.rows.map(row => row.id));
    console.log(`⚽ Teams válidos: ${validTeamIds.size}`);

    // 6. Filtrar matches com teams válidos
    const validMatches = sourceData.rows.filter(row => {
      const homeTeamExists = !row.home_team_id || validTeamIds.has(row.home_team_id);
      const awayTeamExists = !row.away_team_id || validTeamIds.has(row.away_team_id);
      
      if (!homeTeamExists) {
        console.log(`⚠️  Removendo match ${row.id} - home_team_id ${row.home_team_id} não existe`);
        return false;
      }
      
      if (!awayTeamExists) {
        console.log(`⚠️  Removendo match ${row.id} - away_team_id ${row.away_team_id} não existe`);
        return false;
      }
      
      return true;
    });

    console.log(`✅ ${validMatches.length} matches válidos após filtros`);

    // 7. Processar cada match
    let processedCount = 0;
    let errorCount = 0;
    const batchSize = 100;

    const placeholders = filteredColumns.map((_, index) => `$${index + 1}`).join(', ');
    const insertQuery = `INSERT INTO matches (${filteredColumns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders});`;

    for (let i = 0; i < validMatches.length; i += batchSize) {
      const batch = validMatches.slice(i, i + batchSize);
      
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
      const progress = Math.round((i / validMatches.length) * 100);
      console.log(`⏳ Progresso: ${progress}% (${processedCount} processados, ${errorCount} erros)`);
    }

    console.log(`\n✅ Processamento concluído!`);
    console.log(`📊 ${processedCount} registros inseridos`);
    console.log(`❌ ${errorCount} erros encontrados`);

    // 8. Verificar resultado
    const result = await devClient.query('SELECT COUNT(*) as count FROM matches;');
    console.log(`📊 Total de registros na tabela matches: ${result.rows[0].count}`);

  } catch (error) {
    console.error('💥 Erro fatal:', error);
    throw error;
  } finally {
    await prodClient.end();
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixMatchesOnly()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixMatchesOnly };

