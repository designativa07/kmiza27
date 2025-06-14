const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function addSampleData() {
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
    console.log('Conectado ao banco de dados PostgreSQL');

    // Ler e executar sample-matches.sql
    const sampleSQL = fs.readFileSync(path.join(__dirname, 'sample-matches.sql'), 'utf8');
    await client.query(sampleSQL);
    console.log('Dados de exemplo inseridos com sucesso!');

  } catch (error) {
    console.error('Erro ao inserir dados de exemplo:', error);
  } finally {
    await client.end();
  }
}

addSampleData(); 