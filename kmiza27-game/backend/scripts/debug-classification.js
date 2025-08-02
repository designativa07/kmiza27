const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseServiceKey = 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugClassification() {
  try {
    console.log('🔍 Debugando problema da classificação...');
    
    // 1. Verificar se há partidas finalizadas
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('*')
      .eq('status', 'finished');
    
    if (matchesError) {
      console.error('❌ Erro ao buscar partidas:', matchesError);
      return;
    }
    
    console.log(`📊 Total de partidas finalizadas: ${matches.length}`);
    
    if (matches.length === 0) {
      console.log('⚠️ Não há partidas finalizadas. A classificação não pode ser calculada.');
      console.log('💡 Para testar a classificação, você precisa:');
      console.log('   1. Ter times inscritos em competições');
      console.log('   2. Ter partidas criadas');
      console.log('   3. Simular algumas partidas para finalizá-las');
      return;
    }
    
    // 2. Verificar standings atuais
    const currentYear = new Date().getFullYear();
    const { data: standings, error: standingsError } = await supabase
      .from('game_standings')
      .select('*')
      .eq('season_year', currentYear);
    
    if (standingsError) {
      console.error('❌ Erro ao buscar standings:', standingsError);
      return;
    }
    
    console.log(`📈 Total de standings para ${currentYear}: ${standings.length}`);
    
    // 3. Verificar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*');
    
    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }
    
    console.log(`🏆 Total de competições: ${competitions.length}`);
    
    // 4. Para cada competição, analisar detalhadamente
    for (const competition of competitions) {
      console.log(`\n📊 Analisando ${competition.name} (ID: ${competition.id}):`);
      
      // Verificar times inscritos
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select(`
          *,
          game_teams(id, name, team_type)
        `)
        .eq('competition_id', competition.id);
      
      if (teamsError) {
        console.error(`❌ Erro ao buscar times inscritos:`, teamsError);
        continue;
      }
      
      console.log(`  👥 Times inscritos: ${enrolledTeams.length}`);
      
      // Verificar partidas da competição
      const { data: compMatches, error: compMatchesError } = await supabase
        .from('game_matches')
        .select('*')
        .eq('competition_id', competition.id);
      
      if (compMatchesError) {
        console.error(`❌ Erro ao buscar partidas:`, compMatchesError);
        continue;
      }
      
      const finishedMatches = compMatches.filter(m => m.status === 'finished');
      console.log(`  ⚽ Partidas da competição: ${compMatches.length} total, ${finishedMatches.length} finalizadas`);
      
      // Verificar standings da competição
      const { data: compStandings, error: compStandingsError } = await supabase
        .from('game_standings')
        .select('*')
        .eq('competition_id', competition.id)
        .eq('season_year', currentYear);
      
      if (compStandingsError) {
        console.error(`❌ Erro ao buscar standings:`, compStandingsError);
        continue;
      }
      
      console.log(`  📈 Standings da competição: ${compStandings.length}`);
      
      if (finishedMatches.length > 0 && compStandings.length === 0) {
        console.log(`  🔧 PROBLEMA IDENTIFICADO: Há partidas finalizadas mas não há standings!`);
        console.log(`  💡 Solução: Executar updateStandings para ${competition.name}`);
        
        // Calcular standings manualmente para verificar
        const teamStats = new Map();
        
        for (const match of finishedMatches) {
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
        
        console.log(`  📊 Classificação calculada para ${calculatedStandings.length} times:`);
        calculatedStandings.forEach((standing, index) => {
          console.log(`    ${index + 1}. Time ${standing.team_id}: ${standing.points}pts (${standing.wins}V/${standing.draws}E/${standing.losses}D) - GF:${standing.goals_for} GA:${standing.goals_against}`);
        });
        
        // Salvar no banco
        console.log(`  💾 Salvando standings no banco...`);
        for (const standing of calculatedStandings) {
          const { error: insertError } = await supabase
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
          
          if (insertError) {
            console.error(`    ❌ Erro ao salvar standing para time ${standing.team_id}:`, insertError);
          } else {
            console.log(`    ✅ Standing salvo para time ${standing.team_id}`);
          }
        }
      } else if (compStandings.length > 0) {
        console.log(`  ✅ Standings já existem para ${competition.name}`);
        compStandings.forEach((standing, index) => {
          console.log(`    ${index + 1}. Time ${standing.team_id}: ${standing.points}pts (${standing.wins}V/${standing.draws}E/${standing.losses}D) - Pos: ${standing.position}`);
        });
      } else {
        console.log(`  ⚠️ Nenhuma partida finalizada em ${competition.name}`);
      }
    }
    
    console.log('\n🎉 Debug da classificação concluído!');
    
  } catch (error) {
    console.error('❌ Erro no debug da classificação:', error);
  }
}

debugClassification(); 