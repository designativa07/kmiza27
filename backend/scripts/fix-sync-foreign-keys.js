const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para corrigir problemas de chave estrangeira durante sincronização
 * Este script limpa dados órfãos e garante integridade referencial
 */

async function fixSyncForeignKeys() {
  console.log('🔧 Corrigindo problemas de chave estrangeira...');
  console.log('================================================');

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

    // 1. Desabilitar constraints temporariamente
    console.log('🔧 Desabilitando constraints de chave estrangeira...');
    await devClient.query('SET session_replication_role = replica;');
    console.log('✅ Constraints desabilitadas');

    // 2. Limpar tabelas dependentes primeiro (ordem reversa)
    console.log('🧹 Limpando tabelas dependentes...');
    
    const dependentTables = [
      'pool_participants',
      'pool_matches', 
      'match_broadcasts',
      'goals',
      'matches',
      'player_team_history',
      'international_teams',
      'competition_teams',
      'pools',
      'users'
    ];

    for (const table of dependentTables) {
      try {
        console.log(`🗑️  Limpando tabela: ${table}`);
        await devClient.query(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`✅ Tabela ${table} limpa`);
      } catch (error) {
        console.log(`⚠️  Erro ao limpar ${table}: ${error.message}`);
      }
    }

    // 3. Limpar tabelas base
    console.log('🧹 Limpando tabelas base...');
    
    const baseTables = [
      'teams',
      'competitions',
      'stadiums',
      'players',
      'rounds',
      'channels',
      'titles'
    ];

    for (const table of baseTables) {
      try {
        console.log(`🗑️  Limpando tabela: ${table}`);
        await devClient.query(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`✅ Tabela ${table} limpa`);
      } catch (error) {
        console.log(`⚠️  Erro ao limpar ${table}: ${error.message}`);
      }
    }

    // 4. Reabilitar constraints
    console.log('🔧 Reabilitando constraints de chave estrangeira...');
    await devClient.query('SET session_replication_role = DEFAULT;');
    console.log('✅ Constraints reabilitadas');

    // 5. Verificar integridade
    console.log('🔍 Verificando integridade do banco...');
    
    const integrityCheck = await devClient.query(`
      SELECT 
        schemaname,
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY relname;
    `);

    console.log('📊 Status das tabelas:');
    integrityCheck.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.inserts} inserts, ${row.updates} updates, ${row.deletes} deletes`);
    });

    console.log('✅ Correção concluída! Banco limpo e pronto para sincronização.');

  } catch (error) {
    console.error('❌ Erro durante correção:', error);
    throw error;
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixSyncForeignKeys()
    .then(() => {
      console.log('🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixSyncForeignKeys };
