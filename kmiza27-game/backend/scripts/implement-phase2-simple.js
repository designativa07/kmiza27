const { getSupabaseClient } = require('../config/supabase-connection');

async function implementPhase2Simple() {
  try {
    console.log('🎯 IMPLEMENTANDO FASE 2 - VERSÃO SIMPLIFICADA');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. VERIFICAR COMPETIÇÕES EXISTENTES
    console.log('\n📋 1. Verificando competições existentes...');
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });
    
    if (compError) {
      console.log(`❌ Erro ao buscar competições: ${compError.message}`);
      return;
    }
    
    console.log(`✅ Encontradas ${competitions.length} competições:`);
    competitions.forEach(comp => {
      console.log(`  🏆 ${comp.name} (Série ${comp.tier}) - ${comp.current_teams}/${comp.max_teams} times`);
    });
    
    // 2. IMPLEMENTAR SISTEMA DE PARTIDAS SIMPLES
    console.log('\n⚽ 2. Implementando sistema de partidas...');
    
    for (const competition of competitions) {
      if (competition.current_teams > 0) {
        console.log(`\n📊 Processando ${competition.name}...`);
        
        // Buscar times inscritos
        const { data: teams, error: teamsError } = await supabase
          .from('game_competition_teams')
          .select('team_id')
          .eq('competition_id', competition.id);
        
        if (teamsError) {
          console.log(`❌ Erro ao buscar times: ${teamsError.message}`);
          continue;
        }
        
        console.log(`  ✅ ${teams.length} times inscritos`);
        
        // Criar partidas simples (todos contra todos)
        await createSimpleMatches(competition, teams);
      }
    }
    
    // 3. IMPLEMENTAR SISTEMA DE CLASSIFICAÇÕES
    console.log('\n📊 3. Implementando sistema de classificações...');
    await implementSimpleStandings();
    
    // 4. IMPLEMENTAR SISTEMA PvP
    console.log('\n🤝 4. Implementando sistema PvP...');
    await implementPvPSystem();
    
    console.log('\n✅ FASE 2 IMPLEMENTADA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro na implementação da FASE 2:', error);
  }
}

async function createSimpleMatches(competition, teams) {
  try {
    const supabase = getSupabaseClient('vps');
    
    const teamIds = teams.map(t => t.team_id);
    
    // Criar partidas simples (todos contra todos)
    let matchCount = 0;
    
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        const homeTeam = teamIds[i];
        const awayTeam = teamIds[j];
        
        // Verificar se a partida já existe
        const { data: existingMatch } = await supabase
          .from('game_matches')
          .select('id')
          .eq('competition_id', competition.id)
          .eq('home_team_id', homeTeam)
          .eq('away_team_id', awayTeam)
          .single();
        
        if (!existingMatch) {
          const { data, error } = await supabase
            .from('game_matches')
            .insert({
              competition_id: competition.id,
              home_team_id: homeTeam,
              away_team_id: awayTeam,
              status: 'scheduled',
              match_date: new Date().toISOString()
            })
            .select()
            .single();
          
          if (error) {
            console.log(`    ❌ Erro ao criar partida: ${error.message}`);
          } else {
            console.log(`    ✅ Partida criada: ${homeTeam} vs ${awayTeam}`);
            matchCount++;
          }
        }
      }
    }
    
    console.log(`    📊 Total de partidas criadas: ${matchCount}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar partidas:', error);
  }
}

async function implementSimpleStandings() {
  try {
    const supabase = getSupabaseClient('vps');
    
    console.log('  📊 Atualizando classificações...');
    
    // Buscar todas as competições
    const { data: competitions } = await supabase
      .from('game_competitions')
      .select('id, name');
    
    for (const competition of competitions) {
      // Buscar times inscritos
      const { data: teams } = await supabase
        .from('game_competition_teams')
        .select('team_id')
        .eq('competition_id', competition.id);
      
      if (teams && teams.length > 0) {
        // Criar/atualizar classificações
        for (const team of teams) {
          const { data: existing } = await supabase
            .from('game_standings')
            .select('id')
            .eq('competition_id', competition.id)
            .eq('team_id', team.team_id)
            .single();
          
          if (!existing) {
            await supabase
              .from('game_standings')
              .insert({
                competition_id: competition.id,
                team_id: team.team_id,
                position: 0,
                points: 0,
                games_played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goals_for: 0,
                goals_against: 0,
                season_year: 2024
              });
          }
        }
        
        console.log(`    ✅ ${competition.name}: ${teams.length} times processados`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao implementar sistema de classificações:', error);
  }
}

async function implementPvPSystem() {
  try {
    const supabase = getSupabaseClient('vps');
    
    console.log('  🤝 Implementando sistema PvP...');
    
    // Verificar se a tabela de partidas diretas existe
    try {
      const { data, error } = await supabase
        .from('game_direct_matches')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('    ⚠️ Tabela game_direct_matches não encontrada');
        console.log('    📋 Sistema PvP será implementado quando a tabela for criada');
      } else {
        console.log('    ✅ Tabela game_direct_matches acessível');
        console.log('    🎮 Sistema PvP pronto para uso');
      }
    } catch (err) {
      console.log('    ⚠️ Tabela game_direct_matches não existe');
    }
    
    // Verificar sistema de convites
    try {
      const { data, error } = await supabase
        .from('game_match_invites')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('    ⚠️ Tabela game_match_invites não encontrada');
      } else {
        console.log('    ✅ Sistema de convites acessível');
      }
    } catch (err) {
      console.log('    ⚠️ Tabela game_match_invites não existe');
    }
    
  } catch (error) {
    console.error('❌ Erro ao implementar sistema PvP:', error);
  }
}

implementPhase2Simple(); 