const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseServiceKey = 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testClassificationAutomatic() {
  try {
    console.log('🔍 Testando atualização automática da classificação...');
    
    // 1. Buscar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });
    
    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }
    
    console.log(`🏆 Encontradas ${competitions.length} competições`);
    
    // 2. Para cada competição, verificar partidas não finalizadas
    for (const competition of competitions) {
      console.log(`\n📊 Analisando ${competition.name}:`);
      
      // Buscar partidas não finalizadas
      const { data: pendingMatches, error: matchesError } = await supabase
        .from('game_matches')
        .select('*')
        .eq('competition_id', competition.id)
        .eq('status', 'scheduled')
        .limit(3); // Simular apenas 3 partidas por competição
      
      if (matchesError) {
        console.error(`❌ Erro ao buscar partidas:`, matchesError);
        continue;
      }
      
      console.log(`  ⚽ Partidas pendentes encontradas: ${pendingMatches.length}`);
      
      if (pendingMatches.length === 0) {
        console.log(`  ⚠️ Nenhuma partida pendente em ${competition.name}`);
        continue;
      }
      
      // 3. Simular partidas
      for (const match of pendingMatches) {
        console.log(`  🎮 Simulando partida: ${match.home_team_name} vs ${match.away_team_name}`);
        
        // Buscar os times
        const { data: homeTeam, error: homeError } = await supabase
          .from('game_teams')
          .select('*')
          .eq('id', match.home_team_id)
          .single();
        
        const { data: awayTeam, error: awayError } = await supabase
          .from('game_teams')
          .select('*')
          .eq('id', match.away_team_id)
          .single();
        
        if (homeError || awayError) {
          console.error(`    ❌ Erro ao buscar times:`, homeError || awayError);
          continue;
        }
        
        // Simular resultado
        const homeAdvantage = 1.2;
        const homeReputation = homeTeam.reputation || 50;
        const awayReputation = awayTeam.reputation || 50;
        
        const homeStrength = (homeReputation * homeAdvantage) + Math.random() * 20;
        const awayStrength = awayReputation + Math.random() * 20;
        
        const strengthDiff = homeStrength - awayStrength;
        const homeGoals = Math.max(0, Math.floor((strengthDiff + 30) / 15) + Math.floor(Math.random() * 3));
        const awayGoals = Math.max(0, Math.floor((30 - strengthDiff) / 15) + Math.floor(Math.random() * 3));
        
        // Atualizar partida
        const { error: updateError } = await supabase
          .from('game_matches')
          .update({
            home_score: homeGoals,
            away_score: awayGoals,
            status: 'finished',
            highlights: [`${homeGoals}x${awayGoals} - ${homeTeam.name} vs ${awayTeam.name}`],
            stats: {
              possession: { home: 50 + Math.random() * 20, away: 50 - Math.random() * 20 },
              shots: { home: homeGoals * 3 + Math.floor(Math.random() * 8), away: awayGoals * 3 + Math.floor(Math.random() * 8) }
            }
          })
          .eq('id', match.id);
        
        if (updateError) {
          console.error(`    ❌ Erro ao atualizar partida:`, updateError);
          continue;
        }
        
        console.log(`    ✅ Partida finalizada: ${homeGoals}x${awayGoals}`);
        
        // Atualizar classificação
        const { error: standingsError } = await supabase
          .rpc('update_competition_standings', { competition_id: competition.id });
        
        if (standingsError) {
          console.log(`    ⚠️ Erro ao atualizar classificação via RPC, tentando método manual...`);
          
          // Método manual de atualização
          await updateStandingsManually(competition.id);
        } else {
          console.log(`    ✅ Classificação atualizada automaticamente`);
        }
      }
      
      // 4. Verificar classificação final
      const currentYear = new Date().getFullYear();
      const { data: finalStandings, error: standingsError } = await supabase
        .from('game_standings')
        .select('*')
        .eq('competition_id', competition.id)
        .eq('season_year', currentYear)
        .order('position', { ascending: true });
      
      if (standingsError) {
        console.error(`❌ Erro ao buscar standings finais:`, standingsError);
        continue;
      }
      
      console.log(`  📈 Classificação final de ${competition.name}:`);
      finalStandings.forEach((standing, index) => {
        console.log(`    ${index + 1}. Time ${standing.team_id}: ${standing.points}pts (${standing.wins}V/${standing.draws}E/${standing.losses}D) - GF:${standing.goals_for} GA:${standing.goals_against}`);
      });
    }
    
    console.log('\n🎉 Teste de classificação automática concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste de classificação automática:', error);
  }
}

async function updateStandingsManually(competitionId) {
  try {
    // Buscar partidas finalizadas
    const { data: matches, error: matchesError } = await supabase
      .from('game_matches')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('status', 'finished');
    
    if (matchesError) throw new Error(`Error fetching matches: ${matchesError.message}`);
    
    // Calcular estatísticas
    const teamStats = new Map();
    
    for (const match of matches) {
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
    const standings = Array.from(teamStats.values()).map(stats => ({
      ...stats,
      points: stats.wins * 3 + stats.draws,
      goal_difference: stats.goals_for - stats.goals_against
    }));
    
    // Ordenar
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });
    
    // Atualizar posições
    for (let i = 0; i < standings.length; i++) {
      standings[i].position = i + 1;
    }
    
    // Atualizar no banco
    const currentYear = new Date().getFullYear();
    for (const standing of standings) {
      await supabase
        .from('game_standings')
        .upsert({
          competition_id: competitionId,
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
    }
    
    console.log(`    ✅ Classificação atualizada manualmente para ${standings.length} times`);
  } catch (error) {
    console.error(`    ❌ Erro na atualização manual:`, error);
  }
}

testClassificationAutomatic(); 