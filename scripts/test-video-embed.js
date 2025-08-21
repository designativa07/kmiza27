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
    
    // Adicionar links de teste (YouTube e Globoplay)
    const testVideoUrls = [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Roll para teste
      "https://globoplay.globo.com/tv-globo/ao-vivo/6120663/" // TV Globo ao vivo
    ];
    
    await client.query(`
      UPDATE matches 
      SET broadcast_channels = $1
      WHERE id = $2
    `, [JSON.stringify(testVideoUrls), 1031]);
    
    console.log('✅ Links de teste adicionados!');
    console.log(`🔗 URLs: ${testVideoUrls.join(', ')}`);
    console.log('\n📱 Agora você pode testar:');
    console.log('1. Acesse: http://localhost:3001/jogos/1031');
    console.log('2. Na seção "Transmissão", você verá:');
    console.log('   - Player do YouTube (funciona com embed)');
    console.log('   - Card especial do Globoplay (não permite embed)');
    console.log('3. Teste o botão "Ocultar" no player do YouTube');
    console.log('4. O card de transmissão agora ocupa toda a largura disponível');
    console.log('5. Clique no card do Globoplay para abrir em nova aba');
    console.log('6. **Teste o Formulário Administrativo**:');
    console.log('   - Acesse: Painel Admin → Jogos → "+ Adicionar Jogo"');
    console.log('   - Na seção "Transmissão", teste o botão "+LINK" azul');
    console.log('   - Adicione múltiplas URLs e verifique os chips removíveis');
    console.log('   - Salve o jogo e teste na página da partida');
    console.log('7. **Nota**: O botão +LINK foi removido da página pública da partida');
    console.log('   - A funcionalidade de adicionar links está disponível apenas nos formulários admin');
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testVideoEmbed();
