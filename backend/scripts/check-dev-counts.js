const { Client } = require('pg');

// Carregar variáveis de ambiente do arquivo correto
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

async function checkDevCounts() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    console.log('🔍 Verificando Contagens no Banco de Desenvolvimento');
    console.log('==================================================');
    console.log('🔌 Conectando ao banco de desenvolvimento...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    const tables = [
      'users', 'matches', 'goals', 'competition_teams', 'pool_matches', 
      'pool_participants', 'pool_predictions', 'simulation_results',
      'chatbot_conversations', 'notifications', 'cards', 'teams', 
      'stadiums', 'players', 'rounds', 'whatsapp_menu_configs', 
      'system_settings', 'competitions'
    ];

    console.log('\n📊 Verificando contagens de dados...');
    console.log('=====================================');

    let totalRecords = 0;
    const tableCounts = {};

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        tableCounts[table] = count;
        totalRecords += count;
        
        if (count > 0) {
          console.log(`✅ ${table}: ${count} registros`);
        } else {
          console.log(`📭 ${table}: 0 registros`);
        }
      } catch (error) {
        console.log(`❌ ${table}: Erro - ${error.message}`);
      }
    }

    console.log('\n📋 Resumo das Contagens:');
    console.log('========================');
    console.log(`📊 Total de registros: ${totalRecords}`);
    console.log(`📈 Tabelas com dados: ${Object.values(tableCounts).filter(count => count > 0).length}`);
    console.log(`📭 Tabelas vazias: ${Object.values(tableCounts).filter(count => count === 0).length}`);

    console.log('\n🏆 Top 10 tabelas com mais dados:');
    const sortedTables = Object.entries(tableCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    sortedTables.forEach(([table, count], index) => {
      if (count > 0) {
        console.log(`   ${index + 1}. ${table}: ${count} registros`);
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkDevCounts();

