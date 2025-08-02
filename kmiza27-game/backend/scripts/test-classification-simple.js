const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseServiceKey = 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testClassificationSimple() {
  try {
    console.log('🔍 Testando classificação de forma simples...');
    
    // 1. Verificar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier')
      .order('tier', { ascending: true });
    
    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }
    
    console.log(`🏆 Encontradas ${competitions.length} competições:`);
    competitions.forEach(comp => {
      console.log(`  - ${comp.name} (Tier ${comp.tier}) - ID: ${comp.id}`);
    });
    
    // 2. Para cada competição, verificar partidas e standings
    for (const competition of competitions) {
      console.log(`\n📊 Analisando ${competition.name}:`);
      
      // Verificar partidas
      const { data: matches, error: matchesError } = await supabase
        .from('game_matches')
        .select('id, home_team_id, away_team_id, home_score, away_score, status')
        .eq('competition_id', competition.id);
      
      if (matchesError) {
        console.error(`❌ Erro ao buscar partidas:`, matchesError);
        continue;
      }
      
      const finishedMatches = matches.filter(m => m.status === 'finished');
      console.log(`  ⚽ Total de partidas: ${matches.length}, Finalizadas: ${finishedMatches.length}`);
      
      // Verificar standings
      const currentYear = new Date().getFullYear();
      const { data: standings, error: standingsError } = await supabase
        .from('game_standings')
        .select('*')
        .eq('competition_id', competition.id)
        .eq('season_year', currentYear);
      
      if (standingsError) {
        console.error(`❌ Erro ao buscar standings:`, standingsError);
        continue;
      }
      
      console.log(`  📈 Standings encontrados: ${standings.length}`);
      
      if (standings.length > 0) {
        console.log(`  📋 Classificação atual:`);
        standings.forEach((standing, index) => {
          console.log(`    ${index + 1}. Time ${standing.team_id}: ${standing.points}pts (${standing.wins}V/${standing.draws}E/${standing.losses}D) - Pos: ${standing.position}`);
        });
      }
      
      // Se há partidas finalizadas mas standings vazios, calcular manualmente
      if (finishedMatches.length > 0 && standings.length === 0) {
        console.log(`  🔧 Calculando classificação manualmente...`);
        
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
        
        console.log(`  📊 Classificação calculada:`);
        calculatedStandings.forEach((standing, index) => {
          console.log(`    ${index + 1}. Time ${standing.team_id}: ${standing.points}pts (${standing.wins}V/${standing.draws}E/${standing.losses}D) - GF:${standing.goals_for} GA:${standing.goals_against}`);
        });
        
        // Inserir no banco
        console.log(`  💾 Salvando no banco...`);
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
      }
    }
    
    console.log('\n🎉 Teste de classificação concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste de classificação:', error);
  }
}

testClassificationSimple(); 