const { Client } = require('pg');

// Configuração do banco de dados
const dbConfig = {
  host: 'h4xd66.easypanel.host',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
  ssl: false
};

const commands = [
  // Criar tabela players
  `CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(50),
    date_of_birth DATE,
    nationality VARCHAR(100),
    image_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  
  // Criar tabela player_team_history
  `CREATE TABLE player_team_history (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    jersey_number VARCHAR(50),
    role VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_player_team_history_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    CONSTRAINT fk_player_team_history_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  )`,
  
  // Criar tabela cards
  `CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    minute INTEGER,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cards_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    CONSTRAINT fk_cards_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  )`,
  
  // Atualizar tabela goals
  `ALTER TABLE goals ADD COLUMN player_id INTEGER`,
  `ALTER TABLE goals ADD COLUMN type VARCHAR(255)`,
  `ALTER TABLE goals ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  `ALTER TABLE goals ADD CONSTRAINT fk_goals_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE`,
  
  // Inserir jogadores de exemplo
  `INSERT INTO players (name, position, nationality) VALUES 
   ('Neymar Jr.', 'Atacante', 'Brasil'),
   ('Lionel Messi', 'Atacante', 'Argentina'),
   ('Cristiano Ronaldo', 'Atacante', 'Portugal'),
   ('Vinícius Jr.', 'Atacante', 'Brasil'),
   ('Kylian Mbappé', 'Atacante', 'França')`
];

async function executeMigration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔗 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado ao banco de dados PostgreSQL');

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        console.log(`📝 Executando comando ${i + 1}/${commands.length}...`);
        await client.query(command);
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      } catch (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message);
        // Continuar mesmo com erro (pode ser que a tabela já exista)
      }
    }

    console.log('\n🔍 Verificando tabelas criadas...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('players', 'player_team_history', 'cards')
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas encontradas:', tablesResult.rows.map(row => row.table_name));
    
    // Contar registros
    for (const table of ['players', 'player_team_history', 'cards']) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📊 ${table}: ${countResult.rows[0].count} registros`);
      } catch (error) {
        console.log(`❌ Erro ao contar ${table}:`, error.message);
      }
    }

    console.log('\n✅ Migração concluída!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão com banco de dados fechada');
  }
}

// Executar a migração
executeMigration().catch(console.error); 