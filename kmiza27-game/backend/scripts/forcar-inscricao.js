const { createClient } = require('@supabase/supabase-js');

// Definir variáveis de ambiente diretamente
const SUPABASE_URL = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

console.log('🔧 Conectando ao Supabase...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function forcarInscricao() {
  console.log('🎯 Forçando inscrição do time do usuário...\n');

  const teamId = '4759404a-231f-4a8d-9f93-a8af7f5bf921'; // Time AAA
  const competitionId = '045a3b64-59fc-48fd-ad8f-828b4f1a5319'; // Série D

  try {
    // Buscar times inscritos na Série D
    const { data: enrolledTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select(`
        id,
        team_id,
        game_teams!inner(
          id,
          name,
          team_type
        )
      `)
      .eq('competition_id', competitionId);

    if (teamsError) {
      console.error('❌ Erro ao buscar times inscritos:', teamsError);
      return;
    }

    console.log(`📋 Times inscritos na Série D: ${enrolledTeams.length}`);
    enrolledTeams.forEach(team => {
      console.log(`   - ${team.game_teams.name} (${team.game_teams.team_type})`);
    });

    // Buscar times da máquina
    const machineTeams = enrolledTeams.filter(team => team.game_teams.team_type === 'machine');
    console.log(`🤖 Times da máquina encontrados: ${machineTeams.length}`);

    if (machineTeams.length > 0) {
      // Remover o primeiro time da máquina
      const teamToRemove = machineTeams[0];
      console.log(`🗑️ Removendo time da máquina: ${teamToRemove.game_teams.name} (ID: ${teamToRemove.team_id})`);
      
      // Remover o time da competição
      const { error: removeError } = await supabase
        .from('game_competition_teams')
        .delete()
        .eq('id', teamToRemove.id);

      if (removeError) {
        console.error('❌ Erro ao remover time da máquina:', removeError);
        return;
      }

      console.log('✅ Time da máquina removido com sucesso!');

      // Remover entrada da classificação
      const { error: standingsRemoveError } = await supabase
        .from('game_standings')
        .delete()
        .eq('competition_id', competitionId)
        .eq('team_id', teamToRemove.team_id);

      if (standingsRemoveError) {
        console.log('⚠️ Warning: Erro ao remover entrada da classificação:', standingsRemoveError);
      } else {
        console.log('✅ Entrada da classificação removida');
      }

      // Atualizar contador de times na competição
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: enrolledTeams.length - 1 })
        .eq('id', competitionId);

      if (updateError) {
        console.error('❌ Erro ao atualizar contador da competição:', updateError);
      } else {
        console.log('✅ Contador da competição atualizado');
      }
    }

    // Agora inscrever o time do usuário
    console.log(`📝 Inscrição do time do usuário: ${teamId}`);
    
    const { data: registration, error: insertError } = await supabase
      .from('game_competition_teams')
      .insert({
        competition_id: competitionId,
        team_id: teamId
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inscrever time do usuário:', insertError);
      return;
    }

    console.log('✅ Time do usuário inscrito com sucesso!');

    // Atualizar contador de times na competição
    const { error: updateCountError } = await supabase
      .from('game_competitions')
      .update({ current_teams: enrolledTeams.length })
      .eq('id', competitionId);

    if (updateCountError) {
      console.error('❌ Erro ao atualizar contador final:', updateCountError);
    } else {
      console.log('✅ Contador final atualizado');
    }

    // Criar entrada na classificação
    const { error: standingsError } = await supabase
      .from('game_standings')
      .insert({
        competition_id: competitionId,
        team_id: teamId,
        season_year: new Date().getFullYear(),
        position: 0,
        games_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0
      });

    if (standingsError) {
      console.error('❌ Erro ao criar entrada na classificação:', standingsError);
    } else {
      console.log('✅ Entrada na classificação criada');
    }

    console.log('\n🎉 Inscrição forçada concluída com sucesso!');
    console.log(`📋 Resumo:`);
    console.log(`   - Time do usuário inscrito na Série D`);
    console.log(`   - Time da máquina removido (se necessário)`);
    console.log(`   - Classificação atualizada`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

forcarInscricao(); 