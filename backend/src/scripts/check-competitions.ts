import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: '195.200.0.191',
  database: 'kmiza27',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  port: 5433,
});

async function checkCompetitions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando competições no banco de dados...\n');
    
    const competitions = await client.query(`
      SELECT id, name, country, season 
      FROM competitions 
      ORDER BY name
    `);
    
    competitions.rows.forEach(comp => {
      console.log(`📊 ${comp.name}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   País: ${comp.country || 'N/A'}`);
      console.log(`   Temporada: ${comp.season || 'N/A'}\n`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar competições:', error);
  } finally {
    await client.end();
  }
}

checkCompetitions().catch(console.error); 