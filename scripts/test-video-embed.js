const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'kmiza27_dev',
  user: 'admin',
  password: 'password'
});

async function testVideoEmbed() {
  try {
    await client.connect();
    console.log('🔍 Testando embed de vídeo...');
    
    // Buscar a partida Ceará x Flamengo (ID 1031 conforme URL)
    const match = await client.query(`
      SELECT m.id, m.broadcast_channels, ht.name as home_team, at.name as away_team
      FROM matches m
      LEFT JOIN teams ht ON ht.id = m.home_team_id
      LEFT JOIN teams at ON at.id = m.away_team_id
      WHERE m.id = 1031
    `);
    
    if (match.rows.length === 0) {
      console.log('❌ Partida ID 1031 não encontrada');
      return;
    }
    
    const matchData = match.rows[0];
    console.log(`📋 Partida encontrada: ${matchData.home_team} x ${matchData.away_team}`);
    console.log(`📺 broadcast_channels atual:`, matchData.broadcast_channels);
    
    // Adicionar link de YouTube para teste
    const testVideoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rick Roll para teste
    
    await client.query(`
      UPDATE matches 
      SET broadcast_channels = $1
      WHERE id = $2
    `, [JSON.stringify([testVideoUrl]), 1031]);
    
    console.log('✅ Link de teste adicionado!');
    console.log(`🔗 URL: ${testVideoUrl}`);
    console.log('\n📱 Agora você pode testar:');
    console.log('1. Acesse: http://localhost:3001/jogos/1031');
    console.log('2. Na seção "Transmissão", o vídeo já estará visível');
    console.log('3. Teste o botão "Ocultar" (compacto, à direita, abaixo do vídeo)');
    console.log('4. O card de transmissão agora ocupa toda a largura disponível');
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testVideoEmbed();
