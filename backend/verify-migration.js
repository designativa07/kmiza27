const { Client } = require('pg');

async function verifyMigration() {
  const client = new Client({
    host: '195.200.0.191',
    port: 5433,
    user: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a tabela notification_deliveries existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notification_deliveries'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela notification_deliveries criada');
    } else {
      console.log('❌ Tabela notification_deliveries não encontrada');
    }

    // Verificar colunas da tabela notifications
    const columnsCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('send_status', 'started_at', 'completed_at', 'total_recipients');
    `);
    
    console.log('✅ Colunas adicionadas à notifications:', columnsCheck.rows.map(r => r.column_name));

    // Verificar enums
    const enumsCheck = await client.query(`
      SELECT typname FROM pg_type 
      WHERE typname IN ('notification_send_status', 'delivery_status');
    `);
    
    console.log('✅ Enums criados:', enumsCheck.rows.map(r => r.typname));

    console.log('\n🎉 Migração verificada com sucesso!');

  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  } finally {
    await client.end();
  }
}

verifyMigration(); 