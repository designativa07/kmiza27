const { getSupabaseClient } = require('../config/supabase-connection');

async function autoEnrollWhenUserJoins(competitionId, userTeamId) {
  try {
    console.log('🎯 INSCRIÇÃO AUTOMÁTICA QUANDO USUÁRIO SE INSCREVE');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseClient('vps');
    
    // 1. VERIFICAR COMPETIÇÃO
    console.log('\n📋 1. Verificando competição...');
    const { data: competition, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('id', competitionId)
      .single();
    
    if (compError || !competition) {
      console.log(`❌ Competição não encontrada: ${compError?.message}`);
      return false;
    }
    
    console.log(`✅ Competição: ${competition.name} (Série ${competition.tier})`);
    
    // 2. VERIFICAR SE JÁ TEM TIMES SUFICIENTES
    console.log('\n👥 2. Verificando times inscritos...');
    const { data: enrolledTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select('team_id')
      .eq('competition_id', competitionId);
    
    if (teamsError) {
      console.log(`❌ Erro ao buscar times inscritos: ${teamsError.message}`);
      return false;
    }
    
    const currentTeamCount = enrolledTeams ? enrolledTeams.length : 0;
    console.log(`📊 Times atuais: ${currentTeamCount}/${competition.max_teams}`);
    
    // 3. SE NÃO TEM TIMES SUFICIENTES, INSCREVER TIMES DA MÁQUINA
    if (currentTeamCount < competition.min_teams) {
      console.log('\n🤖 3. Inscrição automática de times da máquina...');
      await enrollMachineTeams(competition);
    } else {
      console.log('\n✅ 3. Competição já tem times suficientes');
    }
    
    // 4. CRIAR CALENDÁRIO SE NECESSÁRIO
    console.log('\n📅 4. Verificando calendário de jogos...');
    await createMatchScheduleIfNeeded(competition);
    
    // 5. CRIAR CLASSIFICAÇÕES SE NECESSÁRIO
    console.log('\n📊 5. Verificando classificações...');
    await createStandingsIfNeeded(competition);
    
    console.log('\n✅ SISTEMA AUTOMÁTICO ATIVADO!');
    console.log('🎮 A competição está pronta para começar!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro na inscrição automática:', error);
    return false;
  }
}

async function enrollMachineTeams(competition) {
  try {
    const supabase = getSupabaseClient('vps');
    
    // Buscar times da máquina para esta série
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .eq('team_type', 'machine')
      .eq('machine_tier', competition.tier);
    
    if (teamsError) {
      console.log(`❌ Erro ao buscar times da máquina: ${teamsError.message}`);
      return;
    }
    
    console.log(`🤖 ${machineTeams.length} times da máquina encontrados`);
    
    // Calcular quantos times precisamos
    const neededTeams = competition.min_teams - competition.current_teams;
    console.log(`📊 Precisamos de ${neededTeams} times adicionais`);
    
    let enrolledCount = 0;
    for (const team of machineTeams) {
      if (enrolledCount >= neededTeams) break;
      
      // Verificar se já está inscrito
      const { data: existingEnrollment } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', competition.id)
        .eq('team_id', team.id)
        .single();
      
      if (!existingEnrollment) {
        const { error: enrollError } = await supabase
          .from('game_competition_teams')
          .insert({
            competition_id: competition.id,
            team_id: team.id,
            status: 'active',
            created_at: new Date().toISOString()
          });
        
        if (enrollError) {
          console.log(`❌ Erro ao inscrever ${team.name}: ${enrollError.message}`);
        } else {
          console.log(`✅ ${team.name} inscrito`);
          enrolledCount++;
        }
      }
    }
    
    // Atualizar contador de times
    const { data: totalTeams } = await supabase
      .from('game_competition_teams')
      .select('id', { count: 'exact' })
      .eq('competition_id', competition.id);
    
    await supabase
      .from('game_competitions')
      .update({ current_teams: totalTeams.length })
      .eq('id', competition.id);
    
    console.log(`📊 ${enrolledCount} times inscritos (Total: ${totalTeams.length})`);
    
  } catch (error) {
    console.error('❌ Erro ao inscrever times da máquina:', error);
  }
}

async function createMatchScheduleIfNeeded(competition) {
  try {
    const supabase = getSupabaseClient('vps');
    
    // Verificar se já existem partidas
    const { data: existingMatches, error: matchesError } = await supabase
      .from('game_matches')
      .select('id')
      .eq('competition_id', competition.id)
      .limit(1);
    
    if (matchesError) {
      console.log(`❌ Erro ao verificar partidas: ${matchesError.message}`);
      return;
    }
    
    if (existingMatches && existingMatches.length > 0) {
      console.log('✅ Calendário de jogos já existe');
      return;
    }
    
    console.log('📅 Criando calendário de jogos...');
    
    // Buscar todos os times inscritos
    const { data: enrolledTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select('team_id')
      .eq('competition_id', competition.id);
    
    if (teamsError || !enrolledTeams || enrolledTeams.length < 2) {
      console.log('⚠️ Não há times suficientes para criar partidas');
      return;
    }
    
    const teamIds = enrolledTeams.map(t => t.team_id);
    console.log(`👥 ${teamIds.length} times para criar partidas`);
    
    // Criar partidas (todos contra todos - ida e volta)
    let matchCount = 0;
    const startDate = new Date();
    let currentDate = new Date(startDate);
    
    for (let round = 1; round <= 2; round++) { // Ida e volta
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          const homeTeam = round === 1 ? teamIds[i] : teamIds[j];
          const awayTeam = round === 1 ? teamIds[j] : teamIds[i];
          
          // Adicionar 3 dias entre partidas
          currentDate.setDate(currentDate.getDate() + 3);
          
          const { error } = await supabase
            .from('game_matches')
            .insert({
              competition_id: competition.id,
              home_team_id: homeTeam,
              away_team_id: awayTeam,
              status: 'scheduled',
              match_date: currentDate.toISOString(),
              round: round,
              created_at: new Date().toISOString()
            });
          
          if (error) {
            console.log(`❌ Erro ao criar partida: ${error.message}`);
          } else {
            matchCount++;
          }
        }
      }
    }
    
    console.log(`⚽ ${matchCount} partidas criadas`);
    
  } catch (error) {
    console.error('❌ Erro ao criar calendário:', error);
  }
}

async function createStandingsIfNeeded(competition) {
  try {
    const supabase = getSupabaseClient('vps');
    
    // Verificar se já existem classificações
    const { data: existingStandings, error: standingsError } = await supabase
      .from('game_standings')
      .select('id')
      .eq('competition_id', competition.id)
      .limit(1);
    
    if (standingsError) {
      console.log(`❌ Erro ao verificar classificações: ${standingsError.message}`);
      return;
    }
    
    if (existingStandings && existingStandings.length > 0) {
      console.log('✅ Classificações já existem');
      return;
    }
    
    console.log('📊 Criando classificações...');
    
    // Buscar times inscritos
    const { data: enrolledTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select('team_id')
      .eq('competition_id', competition.id);
    
    if (teamsError || !enrolledTeams) {
      console.log(`❌ Erro ao buscar times: ${teamsError?.message}`);
      return;
    }
    
    let standingsCount = 0;
    for (const team of enrolledTeams) {
      const { error } = await supabase
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
          goal_difference: 0,
          season_year: 2024,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.log(`❌ Erro ao criar classificação: ${error.message}`);
      } else {
        standingsCount++;
      }
    }
    
    console.log(`📊 ${standingsCount} classificações criadas`);
    
  } catch (error) {
    console.error('❌ Erro ao criar classificações:', error);
  }
}

// Função para ser chamada quando um usuário se inscreve
async function handleUserEnrollment(competitionId, userTeamId) {
  console.log(`🎯 Usuário se inscreveu na competição ${competitionId} com time ${userTeamId}`);
  
  const success = await autoEnrollWhenUserJoins(competitionId, userTeamId);
  
  if (success) {
    console.log('✅ Sistema automático ativado com sucesso!');
    return {
      success: true,
      message: 'Competição preparada automaticamente com times da máquina e calendário criado'
    };
  } else {
    console.log('❌ Falha no sistema automático');
    return {
      success: false,
      message: 'Erro ao preparar competição automaticamente'
    };
  }
}

// Exportar funções para uso em outros módulos
module.exports = {
  autoEnrollWhenUserJoins,
  handleUserEnrollment,
  enrollMachineTeams,
  createMatchScheduleIfNeeded,
  createStandingsIfNeeded
};

// Teste direto (se executado diretamente)
if (require.main === module) {
  console.log('🧪 TESTE DO SISTEMA AUTOMÁTICO');
  console.log('Para testar, chame: node auto-enroll-when-user-joins.js <competition_id> <user_team_id>');
  
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    const [competitionId, userTeamId] = args;
    handleUserEnrollment(competitionId, userTeamId);
  } else {
    console.log('❌ Uso: node auto-enroll-when-user-joins.js <competition_id> <user_team_id>');
  }
} 