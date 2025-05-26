const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  host: '195.200.0.191',
  port: 5433,
  database: 'kmiza27',
  user: 'postgres',
  password: '8F1DC9A7F9CE32C4D32E88A1C5FF7',
});

async function testDatabaseAndChatbot() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testando conexão com banco e dados...\n');
    
    // 1. Testar busca de time
    console.log('⚽ Testando busca de times...');
    const flamengoResult = await client.query(`
      SELECT id, name, short_name, city, state 
      FROM teams 
      WHERE LOWER(name) LIKE '%flamengo%' 
      LIMIT 1
    `);
    
    if (flamengoResult.rows.length > 0) {
      const team = flamengoResult.rows[0];
      console.log(`✅ Time encontrado: ${team.name} (${team.short_name}) - ${team.city}/${team.state}`);
      
      // 2. Buscar próximos jogos do time
      console.log('\n🎮 Buscando próximos jogos do Flamengo...');
      const matchesResult = await client.query(`
        SELECT 
          c.name as competition,
          ht.name as home_team,
          at.name as away_team,
          m.match_date,
          s.name as stadium,
          r.name as round_name
        FROM matches m
        JOIN competitions c ON m.competition_id = c.id
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        JOIN stadiums s ON m.stadium_id = s.id
        JOIN rounds r ON m.round_id = r.id
        WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
          AND m.status = 'scheduled'
          AND m.match_date >= NOW()
        ORDER BY m.match_date
        LIMIT 5
      `, [team.id]);
      
      if (matchesResult.rows.length > 0) {
        console.log(`✅ Encontrados ${matchesResult.rows.length} jogos futuros:`);
        matchesResult.rows.forEach(match => {
          const date = new Date(match.match_date);
          const formattedDate = date.toLocaleDateString('pt-BR');
          const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          
          console.log(`   📅 ${formattedDate} às ${formattedTime}`);
          console.log(`   🏆 ${match.competition} (${match.round_name})`);
          console.log(`   ⚽ ${match.home_team} vs ${match.away_team}`);
          console.log(`   🏟️ ${match.stadium}\n`);
        });
        
        // 3. Simular resposta do chatbot
        console.log('🤖 Simulando resposta do chatbot...');
        const nextMatch = matchesResult.rows[0];
        const date = new Date(nextMatch.match_date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const response = `🔥 **PRÓXIMO JOGO DO FLAMENGO** 🔥

📅 **Data:** ${formattedDate}
⏰ **Horário:** ${formattedTime}
🏆 **Competição:** ${nextMatch.competition}
⚽ **Jogo:** ${nextMatch.home_team} vs ${nextMatch.away_team}
🏟️ **Estádio:** ${nextMatch.stadium}
📍 **Rodada:** ${nextMatch.round_name}

Vai ter Mengão! 🔴⚫`;

        console.log('\n📱 Resposta formatada para WhatsApp:');
        console.log('=' .repeat(50));
        console.log(response);
        console.log('=' .repeat(50));
        
      } else {
        console.log('❌ Nenhum jogo futuro encontrado para o Flamengo');
      }
      
    } else {
      console.log('❌ Time Flamengo não encontrado no banco');
    }
    
    // 4. Testar busca genérica
    console.log('\n🔍 Testando busca genérica de times...');
    const allTeamsResult = await client.query(`
      SELECT name, short_name, country 
      FROM teams 
      WHERE country = 'Brasil'
      ORDER BY name 
      LIMIT 10
    `);
    
    console.log(`✅ Times brasileiros encontrados: ${allTeamsResult.rows.length}`);
    allTeamsResult.rows.forEach(team => {
      console.log(`   - ${team.name} (${team.short_name})`);
    });
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('🎉 Banco de dados funcionando perfeitamente!');
    console.log('🤖 Chatbot pronto para responder sobre jogos!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o teste
testDatabaseAndChatbot(); 