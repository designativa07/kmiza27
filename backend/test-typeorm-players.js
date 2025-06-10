const { DataSource } = require('typeorm');
const { Player } = require('./dist/entities/player.entity');

async function testTypeORMPlayers() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: '195.200.0.191',
    port: 5433,
    username: 'postgres',
    password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
    database: 'kmiza27',
    ssl: false,
    entities: [Player],
    synchronize: false,
  });

  try {
    console.log('🔌 Inicializando DataSource...');
    await dataSource.initialize();
    console.log('✅ DataSource inicializado!');

    const playerRepository = dataSource.getRepository(Player);
    
    console.log('🔍 Buscando jogadores...');
    const players = await playerRepository.find();
    console.log(`✅ ${players.length} jogadores encontrados`);
    
    if (players.length > 0) {
      console.log('📋 Primeiro jogador:', players[0]);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 DataSource fechado');
    }
  }
}

testTypeORMPlayers(); 