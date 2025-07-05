const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'devuser',
  password: 'devuser'
});

async function addKnockoutColumn() {
  try {
    await client.connect();
    console.log('🔌 Conectado ao banco de dados');
    
    // Verificar se a coluna já existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'matches' AND column_name = 'is_knockout'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('➕ Adicionando coluna is_knockout...');
      
      // Adicionar coluna
      await client.query(`
        ALTER TABLE matches 
        ADD COLUMN is_knockout boolean NOT NULL DEFAULT false
      `);
      
      console.log('✅ Coluna is_knockout adicionada');
      
      // Atualizar partidas existentes que são mata-mata
      console.log('🔄 Atualizando partidas existentes...');
      
      const updateResult = await client.query(`
        UPDATE matches 
        SET is_knockout = true 
        WHERE leg IN ('first_leg', 'second_leg') 
           OR tie_id IS NOT NULL
           OR phase IN ('Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final', 'Disputa do 3º lugar')
      `);
      
      console.log(`✅ ${updateResult.rowCount} partidas atualizadas como mata-mata`);
      
      // Registrar a migration como executada
      await client.query(`
        INSERT INTO migrations (timestamp, name) 
        VALUES (1751470000000, 'AddIsKnockoutToMatches1751470000000')
        ON CONFLICT (timestamp, name) DO NOTHING
      `);
      
      console.log('✅ Migration registrada no banco!');
      
    } else {
      console.log('⚠️ Coluna is_knockout já existe');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada');
  }
}

addKnockoutColumn(); 