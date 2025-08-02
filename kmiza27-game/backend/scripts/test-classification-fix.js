const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseServiceKey = 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testClassification() {
  try {
    console.log('🔍 Testando classificação...');
    
    // 1. Verificar se há partidas finalizadas
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('*')
      .eq('status', 'finished');
    
    if (matchesError) {
      console.error('❌ Erro ao buscar partidas:', matchesError);
      return;
    }
    
    console.log(`📊 Encontradas ${matches.length} partidas finalizadas`);
    
    // 2. Verificar standings atuais
    const { data: standings, error: standingsError } = await supabase
      .from('game_standings')
      .select('*');
    
    if (standingsError) {
      console.error('❌ Erro ao buscar standings:', standingsError);
      return;
    }
    
    console.log(`📈 Encontrados ${standings.length} registros de standings`);
    
    // 3. Verificar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*');
    
    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }
    
    console.log(`🏆 Encontradas ${competitions.length} competições`);
    
    // 4. Testar atualização de standings para cada competição
    for (const competition of competitions) {
      console.log(`\n🔄 Testando competição: ${competition.name} (ID: ${competition.id})`);
      
      // Buscar partidas da competição
      const { data: compMatches, error: compMatchesError } = await supabase
        .from('game_matches')
        .select('*')
        .eq('competition_id', competition.id)
        .eq('status', 'finished');
      
      if (compMatchesError) {
        console.error(`❌ Erro ao buscar partidas da competição ${competition.name}:`, compMatchesError);
        continue;
      }
      
      console.log(`⚽ ${compMatches.length} partidas finalizadas na ${competition.name}`);
      
      if (compMatches.length > 0) {
        // Calcular standings manualmente
        const teamStats = new Map();
        
        for (const match of compMatches) {
          // Time da casa
          if (!teamStats.has(match.home_team_id)) {
            teamStats.set(match.home_team_id, {
              team_id: match.home_team_id,
              games_played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0
            });
          }
          
          // Time visitante
          if (!teamStats.has(match.away_team_id)) {
            teamStats.set(match.away_team_id, {
              team_id: match.away_team_id,
              games_played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0
            });
          }
          
          const homeStats = teamStats.get(match.home_team_id);
          const awayStats = teamStats.get(match.away_team_id);
          
          // Atualizar estatísticas
          homeStats.games_played++;
          awayStats.games_played++;
          
          homeStats.goals_for += match.home_score;
          homeStats.goals_against += match.away_score;
          awayStats.goals_for += match.away_score;
          awayStats.goals_against += match.home_score;
          
          if (match.home_score > match.away_score) {
            homeStats.wins++;
            awayStats.losses++;
          } else if (match.home_score < match.away_score) {
            awayStats.wins++;
            homeStats.losses++;
          } else {
            homeStats.draws++;
            awayStats.draws++;
          }
        }
        
        // Calcular pontos e posições
        const calculatedStandings = Array.from(teamStats.values()).map(stats => ({
          ...stats,
          points: stats.wins * 3 + stats.draws,
          goal_difference: stats.goals_for - stats.goals_against
        }));
        
        // Ordenar
        calculatedStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
          return b.goals_for - a.goals_for;
        });
        
        // Atualizar posições
        for (let i = 0; i < calculatedStandings.length; i++) {
          calculatedStandings[i].position = i + 1;
        }
        
        console.log(`📊 Classificação calculada para ${calculatedStandings.length} times:`);
        calculatedStandings.forEach((standing, index) => {
          console.log(`${index + 1}. Time ${standing.team_id}: ${standing.points}pts (${standing.wins}V/${standing.draws}E/${standing.losses}D) - GF:${standing.goals_for} GA:${standing.goals_against}`);
        });
        
        // Atualizar no banco
        const currentYear = new Date().getFullYear();
        console.log(`📅 Usando ano da temporada: ${currentYear}`);
        
        for (const standing of calculatedStandings) {
          const { error: updateError } = await supabase
            .from('game_standings')
            .upsert({
              competition_id: competition.id,
              team_id: standing.team_id,
              season_year: currentYear,
              position: standing.position,
              points: standing.points,
              games_played: standing.games_played,
              wins: standing.wins,
              draws: standing.draws,
              losses: standing.losses,
              goals_for: standing.goals_for,
              goals_against: standing.goals_against,
              goal_difference: standing.goal_difference
            });
          
          if (updateError) {
            console.error(`❌ Erro ao atualizar standing para time ${standing.team_id}:`, updateError);
          }
        }
        
        console.log(`✅ Standings atualizados para ${competition.name}`);
      } else {
        console.log(`⚠️ Nenhuma partida finalizada na ${competition.name}`);
      }
    }
    
    console.log('\n🎉 Teste de classificação concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste de classificação:', error);
  }
}

testClassification(); 