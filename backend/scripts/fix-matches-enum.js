const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

/**
 * Script para corrigir erros de enum na tabela matches
 */

async function fixMatchesEnum() {
  console.log('🔧 Corrigindo erros de enum na tabela matches');
  console.log('============================================');

  // Configuração do banco de desenvolvimento
  const devClient = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'kmiza27_dev',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    // Conectar ao banco
    console.log('🔌 Conectando ao banco de desenvolvimento...');
    await devClient.connect();
    console.log('✅ Conectado!');

    // 1. Verificar valores inválidos de status
    console.log('🔍 Verificando status inválidos...');
    const invalidStatus = await devClient.query(`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM matches 
      WHERE status NOT IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')
      GROUP BY status;
    `);

    if (invalidStatus.rows.length > 0) {
      console.log('❌ Status inválidos encontrados:');
      invalidStatus.rows.forEach(row => {
        console.log(`   ${row.status}: ${row.count} registros`);
      });

      // 2. Corrigir status inválidos
      console.log('🔧 Corrigindo status inválidos...');
      
      // Mapear status inválidos para válidos
      const statusMapping = {
        'to_confirm': 'scheduled',
        'confirmed': 'scheduled',
        'in_progress': 'live',
        'completed': 'finished',
        'postponed': 'postponed',
        'cancelled': 'cancelled'
      };

      for (const [invalidStatus, validStatus] of Object.entries(statusMapping)) {
        const result = await devClient.query(`
          UPDATE matches 
          SET status = $1 
          WHERE status = $2;
        `, [validStatus, invalidStatus]);
        
        if (result.rowCount > 0) {
          console.log(`✅ ${result.rowCount} registros atualizados: ${invalidStatus} → ${validStatus}`);
        }
      }
    } else {
      console.log('✅ Nenhum status inválido encontrado');
    }

    // 3. Verificar se há outros problemas
    console.log('🔍 Verificando integridade da tabela...');
    const integrityCheck = await devClient.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
        COUNT(CASE WHEN status = 'live' THEN 1 END) as live,
        COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished,
        COUNT(CASE WHEN status = 'postponed' THEN 1 END) as postponed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM matches;
    `);

    const stats = integrityCheck.rows[0];
    console.log('📊 Estatísticas da tabela matches:');
    console.log(`   Total: ${stats.total_matches}`);
    console.log(`   Agendados: ${stats.scheduled}`);
    console.log(`   Ao vivo: ${stats.live}`);
    console.log(`   Finalizados: ${stats.finished}`);
    console.log(`   Adiados: ${stats.postponed}`);
    console.log(`   Cancelados: ${stats.cancelled}`);

    // 4. Verificar se há registros com status NULL
    const nullStatus = await devClient.query(`
      SELECT COUNT(*) as count 
      FROM matches 
      WHERE status IS NULL;
    `);

    if (nullStatus.rows[0].count > 0) {
      console.log(`⚠️  ${nullStatus.rows[0].count} registros com status NULL, corrigindo...`);
      await devClient.query(`
        UPDATE matches 
        SET status = 'scheduled' 
        WHERE status IS NULL;
      `);
      console.log('✅ Status NULL corrigidos para "scheduled"');
    }

    console.log('\n✅ Correção de enum concluída!');

  } catch (error) {
    console.error('💥 Erro fatal:', error);
    throw error;
  } finally {
    await devClient.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixMatchesEnum()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixMatchesEnum };

