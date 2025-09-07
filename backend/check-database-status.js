const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para verificar o status exato da base de dados
 */

async function checkDatabaseStatus() {
  console.log('🔍 Verificando status da base de dados...');

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

    // 1. Verificar contagem de registros por tabela
    console.log('\n📊 CONTAGEM DE REGISTROS POR TABELA:');
    console.log('=====================================');
    
    const tables = [
      'matches', 'match_broadcasts', 'goals', 'competition_teams', 
      'teams', 'users', 'competitions', 'stadiums', 'players',
      'rounds', 'channels', 'pools', 'pool_matches', 'pool_participants',
      'international_teams', 'player_team_history', 'whatsapp_menu_configs',
      'system_settings', 'bot_configs', 'simulation_results'
    ];

    for (const table of tables) {
      try {
        const result = await devClient.query(`SELECT COUNT(*) as count FROM ${table};`);
        console.log(`  ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`  ${table}: ERRO - ${error.message}`);
      }
    }

    // 2. Verificar status dos matches
    console.log('\n⚽ STATUS DOS MATCHES:');
    console.log('=====================');
    
    const matchStatusResult = await devClient.query(`
      SELECT match_status, COUNT(*) as count 
      FROM matches 
      GROUP BY match_status 
      ORDER BY count DESC;
    `);
    
    matchStatusResult.rows.forEach(row => {
      console.log(`  ${row.match_status}: ${row.count} matches`);
    });

    // 3. Verificar matches com status inválidos
    console.log('\n❌ MATCHES COM STATUS INVÁLIDOS:');
    console.log('=================================');
    
    const invalidStatusResult = await devClient.query(`
      SELECT match_status, COUNT(*) as count 
      FROM matches 
      WHERE match_status NOT IN ('scheduled', 'live', 'completed', 'postponed', 'cancelled')
      GROUP BY match_status;
    `);
    
    if (invalidStatusResult.rows.length > 0) {
      invalidStatusResult.rows.forEach(row => {
        console.log(`  ❌ ${row.match_status}: ${row.count} matches`);
      });
    } else {
      console.log('  ✅ Nenhum status inválido encontrado');
    }

    // 4. Verificar problemas de chave estrangeira
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

    // 5. Verificar problemas de JSON
    console.log('\n📄 VERIFICAÇÃO DE CAMPOS JSON:');
    console.log('==============================');
    
    const jsonFields = ['broadcast_channels', 'match_stats', 'home_team_player_stats', 'away_team_player_stats'];
    
    for (const field of jsonFields) {
      try {
        const jsonResult = await devClient.query(`
          SELECT COUNT(*) as count 
          FROM matches 
          WHERE ${field} IS NOT NULL 
            AND ${field}::text NOT LIKE '{%' 
            AND ${field}::text NOT LIKE '[%';
        `);
        console.log(`  ${field} com formato inválido: ${jsonResult.rows[0].count}`);
      } catch (error) {
        console.log(`  ${field}: ERRO - ${error.message}`);
      }
    }

    // 6. Verificar usuários admin
    console.log('\n👑 USUÁRIOS ADMIN:');
    console.log('==================');
    
    const adminUsers = await devClient.query(`
      SELECT id, email, name, is_admin, is_active 
      FROM users 
      WHERE is_admin = true 
      ORDER BY id;
    `);
    
    adminUsers.rows.forEach(user => {
      console.log(`  ID: ${user.id}, Email: ${user.email || 'null'}, Nome: ${user.name}, Ativo: ${user.is_active}`);
    });

  } catch (error) {
    console.error('💥 Erro:', error);
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkDatabaseStatus()
    .then(() => {
      console.log('\n✅ Verificação concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseStatus };

