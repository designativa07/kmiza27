const { createClient } = require('@supabase/supabase-js');

// Definir variáveis de ambiente diretamente
const SUPABASE_URL = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

console.log('🔧 Conectando ao Supabase...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function adicionarClassificacao() {
  console.log('🎯 Adicionando entradas na classificação para times inscritos...\n');

  const competitionId = '045a3b64-59fc-48fd-ad8f-828b4f1a5319'; // Série D

  try {
    // Buscar times inscritos na Série D
    const { data: enrolledTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select(`
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

    console.log(`📋 Encontrados ${enrolledTeams.length} times inscritos na Série D`);

    // Verificar quais times já têm entrada na classificação
    const { data: existingStandings, error: standingsError } = await supabase
      .from('game_standings')
      .select('team_id')
      .eq('competition_id', competitionId);

    if (standingsError) {
      console.error('❌ Erro ao buscar classificação existente:', standingsError);
      return;
    }

    const existingTeamIds = existingStandings.map(s => s.team_id);
    console.log(`📊 Times com classificação existente: ${existingTeamIds.length}`);

    // Adicionar entradas na classificação para times que não têm
    let addedCount = 0;
    
    for (const enrolledTeam of enrolledTeams) {
      if (!existingTeamIds.includes(enrolledTeam.team_id)) {
        console.log(`📝 Adicionando classificação para ${enrolledTeam.game_teams.name}...`);
        
        const { error: insertError } = await supabase
          .from('game_standings')
          .insert({
            competition_id: competitionId,
            team_id: enrolledTeam.team_id,
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

        if (insertError) {
          console.error(`❌ Erro ao adicionar classificação para ${enrolledTeam.game_teams.name}:`, insertError);
        } else {
          console.log(`✅ Classificação adicionada para ${enrolledTeam.game_teams.name}`);
          addedCount++;
        }
      } else {
        console.log(`ℹ️ ${enrolledTeam.game_teams.name} já tem classificação`);
      }
    }

    console.log(`\n🎉 Processo concluído!`);
    console.log(`📋 Resumo:`);
    console.log(`   - Times inscritos: ${enrolledTeams.length}`);
    console.log(`   - Classificações adicionadas: ${addedCount}`);
    console.log(`   - Total de classificações: ${existingTeamIds.length + addedCount}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

adicionarClassificacao(); 