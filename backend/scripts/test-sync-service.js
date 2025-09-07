const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para testar o SyncService melhorado via API
 */

async function testSyncService() {
  console.log('🧪 Testando SyncService Melhorado');
  console.log('=================================');

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

    // 1. Limpar banco primeiro
    console.log('🧹 Limpando banco...');
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

    await devClient.query('SET session_replication_role = DEFAULT;');
    console.log('✅ Banco limpo');

    // 2. Testar API de sincronização
    console.log('\n🌐 Testando API de sincronização...');
    
    const API_URL = 'http://localhost:3000';
    
    try {
      // Verificar se a API está rodando
      const healthResponse = await fetch(`${API_URL}/health`);
      if (!healthResponse.ok) {
        throw new Error('API não está rodando');
      }
      console.log('✅ API está rodando');

      // Testar endpoint de sincronização
      const syncResponse = await fetch(`${API_URL}/sync/from-production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      const syncData = await syncResponse.json();
      
      if (syncData.success) {
        console.log('✅ Sincronização via API bem-sucedida!');
        console.log(`📊 ${syncData.details.tablesProcessed} tabelas processadas`);
        console.log(`📊 ${syncData.details.totalRowsCopied} registros inseridos`);
      } else {
        console.log('❌ Erro na sincronização via API:', syncData.message);
      }

    } catch (error) {
      console.log('❌ Erro ao testar API:', error.message);
      console.log('💡 Certifique-se de que o backend está rodando (npm run start:dev)');
    }

    // 3. Verificar dados sincronizados
    console.log('\n🔍 Verificando dados sincronizados...');
    
    const checkTables = ['teams', 'users', 'matches', 'competitions'];
    
    for (const table of checkTables) {
      try {
        const result = await devClient.query(`SELECT COUNT(*) as count FROM "${table}";`);
        const count = parseInt(result.rows[0].count);
        console.log(`📊 ${table}: ${count} registros`);
      } catch (error) {
        console.log(`❌ Erro ao verificar ${table}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Erro durante teste:', error);
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testSyncService()
    .then(() => {
      console.log('✅ Teste concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testSyncService };

