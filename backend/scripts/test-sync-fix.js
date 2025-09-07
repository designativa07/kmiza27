const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para testar a correção da sincronização
 * Verifica se as tabelas estão limpas e prontas para sincronização
 */

async function testSyncFix() {
  console.log('🧪 Testando Correção da Sincronização');
  console.log('====================================');

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

    // 1. Verificar se as tabelas estão vazias
    console.log('\n📊 Verificando status das tabelas...');
    
    const tables = [
      'teams', 'users', 'matches', 'competitions', 'pools',
      'competition_teams', 'international_teams', 'player_team_history',
      'goals', 'match_broadcasts', 'pool_matches', 'pool_participants'
    ];

    let allEmpty = true;
    
    for (const table of tables) {
      try {
        const result = await devClient.query(`SELECT COUNT(*) as count FROM "${table}";`);
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
          console.log(`⚠️  ${table}: ${count} registros (deveria estar vazia)`);
          allEmpty = false;
        } else {
          console.log(`✅ ${table}: vazia`);
        }
      } catch (error) {
        console.log(`❌ ${table}: erro - ${error.message}`);
        allEmpty = false;
      }
    }

    if (allEmpty) {
      console.log('\n✅ Todas as tabelas estão vazias - pronto para sincronização!');
    } else {
      console.log('\n⚠️  Algumas tabelas ainda têm dados - execute o script de limpeza primeiro');
    }

    // 2. Verificar constraints
    console.log('\n🔍 Verificando constraints de chave estrangeira...');
    
    const constraints = await devClient.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name;
    `);

    console.log(`📋 Encontradas ${constraints.rows.length} constraints de chave estrangeira:`);
    constraints.rows.forEach(constraint => {
      console.log(`  ${constraint.table_name}.${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });

    // 3. Testar desabilitação de constraints
    console.log('\n🔧 Testando desabilitação de constraints...');
    
    try {
      await devClient.query('SET session_replication_role = replica;');
      console.log('✅ Constraints desabilitadas com sucesso');
      
      await devClient.query('SET session_replication_role = DEFAULT;');
      console.log('✅ Constraints reabilitadas com sucesso');
    } catch (error) {
      console.log(`❌ Erro ao testar constraints: ${error.message}`);
    }

    // 4. Verificar conectividade com produção
    console.log('\n🌐 Testando conectividade com produção...');
    
    if (!process.env.PROD_DB_PASSWORD) {
      console.log('⚠️  PROD_DB_PASSWORD não configurado');
    } else {
      const prodClient = new Client({
        host: process.env.PROD_DB_HOST,
        port: process.env.PROD_DB_PORT,
        database: process.env.PROD_DB_DATABASE,
        user: process.env.PROD_DB_USERNAME,
        password: process.env.PROD_DB_PASSWORD,
      });

      try {
        await prodClient.connect();
        console.log('✅ Conectado à produção com sucesso');
        
        // Contar tabelas na produção
        const prodTables = await prodClient.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `);
        
        console.log(`📊 ${prodTables.rows.length} tabelas encontradas na produção`);
        
        await prodClient.end();
      } catch (error) {
        console.log(`❌ Erro ao conectar com produção: ${error.message}`);
      }
    }

    console.log('\n🎉 Teste concluído!');

  } catch (error) {
    console.error('💥 Erro durante teste:', error);
    throw error;
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testSyncFix()
    .then(() => {
      console.log('✅ Teste executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testSyncFix };

