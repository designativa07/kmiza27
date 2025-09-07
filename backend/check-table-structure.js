const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para verificar a estrutura das tabelas
 */

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura das tabelas...');

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

    // 1. Verificar estrutura da tabela matches
    console.log('\n⚽ ESTRUTURA DA TABELA MATCHES:');
    console.log('===============================');
    
    const matchesColumns = await devClient.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'matches' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    matchesColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // 2. Verificar se existe coluna de status
    console.log('\n🔍 VERIFICANDO COLUNAS DE STATUS:');
    console.log('=================================');
    
    const statusColumns = await devClient.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'matches' 
        AND table_schema = 'public'
        AND (column_name LIKE '%status%' OR column_name LIKE '%state%');
    `);
    
    if (statusColumns.rows.length > 0) {
      statusColumns.rows.forEach(col => {
        console.log(`  ✅ ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('  ❌ Nenhuma coluna de status encontrada');
    }

    // 3. Verificar alguns registros de matches
    console.log('\n📊 AMOSTRA DE REGISTROS DE MATCHES:');
    console.log('===================================');
    
    const sampleMatches = await devClient.query(`
      SELECT id, home_team_id, away_team_id, match_date, created_at
      FROM matches 
      ORDER BY id 
      LIMIT 5;
    `);
    
    sampleMatches.rows.forEach(match => {
      console.log(`  ID: ${match.id}, Home: ${match.home_team_id}, Away: ${match.away_team_id}, Date: ${match.match_date}`);
    });

    // 4. Verificar estrutura da tabela match_broadcasts
    console.log('\n📺 ESTRUTURA DA TABELA MATCH_BROADCASTS:');
    console.log('========================================');
    
    const broadcastsColumns = await devClient.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'match_broadcasts' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    broadcastsColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // 5. Verificar problemas de chave estrangeira
    console.log('\n🔗 VERIFICAÇÃO DE CHAVES ESTRANGEIRAS:');
    console.log('======================================');
    
    // Matches órfãos (sem teams)
    const orphanMatches = await devClient.query(`
      SELECT COUNT(*) as count 
      FROM matches m 
      LEFT JOIN teams ht ON m.home_team_id = ht.id 
      LEFT JOIN teams at ON m.away_team_id = at.id 
      WHERE (m.home_team_id IS NOT NULL AND ht.id IS NULL) 
         OR (m.away_team_id IS NOT NULL AND at.id IS NULL);
    `);
    console.log(`  Matches órfãos (sem teams): ${orphanMatches.rows[0].count}`);

    // Match broadcasts órfãos (sem matches)
    const orphanBroadcasts = await devClient.query(`
      SELECT COUNT(*) as count 
      FROM match_broadcasts mb 
      LEFT JOIN matches m ON mb.match_id = m.id 
      WHERE mb.match_id IS NOT NULL AND m.id IS NULL;
    `);
    console.log(`  Match broadcasts órfãos (sem matches): ${orphanBroadcasts.rows[0].count}`);

    // 6. Verificar se há dados na produção com status
    console.log('\n🔍 VERIFICANDO DADOS NA PRODUÇÃO:');
    console.log('=================================');
    
    // Configuração do banco de produção
    const prodClient = new Client({
      host: process.env.PROD_DB_HOST,
      port: process.env.PROD_DB_PORT,
      database: process.env.PROD_DB_DATABASE,
      user: process.env.PROD_DB_USERNAME,
      password: process.env.PROD_DB_PASSWORD,
    });

    try {
      await prodClient.connect();
      console.log('✅ Conectado à produção');

      // Verificar estrutura da tabela matches na produção
      const prodMatchesColumns = await prodClient.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'matches' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📊 ESTRUTURA DA TABELA MATCHES NA PRODUÇÃO:');
      prodMatchesColumns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`);
      });

      // Verificar se existe coluna de status na produção
      const prodStatusColumns = await prodClient.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'matches' 
          AND table_schema = 'public'
          AND (column_name LIKE '%status%' OR column_name LIKE '%state%');
      `);
      
      if (prodStatusColumns.rows.length > 0) {
        console.log('\n✅ COLUNAS DE STATUS NA PRODUÇÃO:');
        prodStatusColumns.rows.forEach(col => {
          console.log(`  ${col.column_name}: ${col.data_type}`);
        });
      } else {
        console.log('\n❌ Nenhuma coluna de status encontrada na produção');
      }

    } catch (prodError) {
      console.log('❌ Erro ao conectar à produção:', prodError.message);
    } finally {
      await prodClient.end();
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkTableStructure()
    .then(() => {
      console.log('\n✅ Verificação concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { checkTableStructure };

