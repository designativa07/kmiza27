const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function insertFutureMatches() {
  const client = new Client({
    host: '195.200.0.191',
    port: 5433,
    user: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
  });

  try {
    console.log('🔗 Conectando ao banco PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'future-matches.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executando script de jogos futuros...');
    const result = await client.query(sql);
    
    console.log('✅ Jogos futuros inseridos com sucesso!');
    console.log('📊 Resultado:', result);

    // Verificar quantos jogos futuros existem agora
    const countResult = await client.query(`
      SELECT COUNT(*) as total_future_matches 
      FROM matches 
      WHERE match_date > NOW()
    `);
    
    console.log(`🎯 Total de jogos futuros: ${countResult.rows[0].total_future_matches}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada.');
  }
}

insertFutureMatches(); 