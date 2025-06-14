const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
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

    // Ler e executar schema.sql
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('Schema criado com sucesso!');

    // Ler e executar seed-teams.sql
    const teamsSQL = fs.readFileSync(path.join(__dirname, 'seed-teams.sql'), 'utf8');
    await client.query(teamsSQL);
    console.log('Times inseridos com sucesso!');

    console.log('Banco de dados configurado com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
  } finally {
    await client.end();
  }
}

setupDatabase(); 