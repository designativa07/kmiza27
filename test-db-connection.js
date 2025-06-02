const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: 'h4xd66.easypanel.host',
    port: 5433,
    user: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
    ssl: false,
    connectionTimeoutMillis: 30000,
    query_timeout: 30000,
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000,
    keepalive: true
  });

  try {
    console.log('Tentando conectar ao banco de dados...');
    await client.connect();
    console.log('Conexão bem sucedida!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Hora do servidor:', result.rows[0].now);
    
  } catch (error) {
    console.error('Erro ao conectar:', error);
    console.error('Detalhes da conexão:', {
      host: client.connectionParameters.host,
      port: client.connectionParameters.port,
      database: client.connectionParameters.database
    });
  } finally {
    await client.end();
  }
}

testConnection(); 