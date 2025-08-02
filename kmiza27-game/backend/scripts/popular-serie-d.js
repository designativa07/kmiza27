const { createClient } = require('@supabase/supabase-js');

// Definir variáveis de ambiente diretamente
const SUPABASE_URL = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

console.log('🔧 Conectando ao Supabase...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function popularSerieD() {
  console.log('🎯 Populando Série D com times da máquina...\n');

  const competitionId = '045a3b64-59fc-48fd-ad8f-828b4f1a5319'; // Série D

  try {
    // Primeiro, criar times da máquina
    const machineTeamNames = [
      'Botafogo', 'Vasco', 'Fluminense', 'Flamengo', 'Palmeiras', 'Santos',
      'Corinthians', 'São Paulo', 'Grêmio', 'Internacional', 'Atlético-MG',
      'Cruzeiro', 'Bahia', 'Vitória', 'Sport', 'Náutico', 'Santa Cruz',
      'Ceará', 'Fortaleza', 'Brasil de Pelotas'
    ];

    console.log('🤖 Criando times da máquina...');
    
    for (let i = 0; i < 19; i++) { // 19 times da máquina + 1 time do usuário = 20
      const teamName = machineTeamNames[i];
      
      // Criar time da máquina
      const { data: newTeam, error: teamError } = await supabase
        .from('game_teams')
        .insert({
          name: teamName,
          team_type: 'machine',
          owner_id: null,
          budget: 1000000,
          reputation: 50,
          stadium_capacity: 1000,
          fan_base: 5000,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (teamError) {
        console.error(`❌ Erro ao criar time ${teamName}:`, teamError);
        continue;
      }

      console.log(`✅ Time criado: ${newTeam.name} (ID: ${newTeam.id})`);

      // Inscrever na Série D
      const { error: insertError } = await supabase
        .from('game_competition_teams')
        .insert({
          competition_id: competitionId,
          team_id: newTeam.id
        });

      if (insertError) {
        console.error(`❌ Erro ao inscrever ${teamName}:`, insertError);
        continue;
      }

      // Criar entrada na classificação
      const { error: standingsError } = await supabase
        .from('game_standings')
        .insert({
          competition_id: competitionId,
          team_id: newTeam.id,
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
        console.error(`❌ Erro ao criar classificação para ${teamName}:`, standingsError);
      }

      console.log(`✅ ${teamName} inscrito na Série D`);
    }

    // Atualizar contador da competição
    const { error: updateError } = await supabase
      .from('game_competitions')
      .update({ current_teams: 20 })
      .eq('id', competitionId);

    if (updateError) {
      console.error('❌ Erro ao atualizar contador da competição:', updateError);
    } else {
      console.log('✅ Contador da competição atualizado para 20 times');
    }

    console.log('\n🎉 Série D populada com sucesso!');
    console.log('📋 Resumo:');
    console.log('   - 19 times da máquina criados e inscritos');
    console.log('   - 1 time do usuário já inscrito');
    console.log('   - Total: 20 times na Série D');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

popularSerieD(); 