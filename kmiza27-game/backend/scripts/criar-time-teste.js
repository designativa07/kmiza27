const { createClient } = require('@supabase/supabase-js');

// Definir variáveis de ambiente diretamente
const SUPABASE_URL = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAiImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

console.log('🔧 Conectando ao Supabase com chave de serviço...');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function criarTimeTeste() {
  console.log('🎯 Criando time de teste...\n');

  try {
    // Criar um time de teste
    const { data: newTeam, error: teamError } = await supabase
      .from('game_teams')
      .insert({
        name: 'PP',
        team_type: 'user',
        owner_id: '550e8400-e29b-41d4-a716-446655440000', // UUID válido
        budget: 1000000,
        reputation: 50,
        stadium_capacity: 1000,
        fan_base: 5000,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (teamError) {
      console.error('❌ Erro ao criar time:', teamError);
      return;
    }

    console.log(`✅ Time criado: ${newTeam.name} (ID: ${newTeam.id})`);

    // Buscar a Série D
    const { data: serieD, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('tier', 4)
      .single();

    if (compError) {
      console.error('❌ Erro ao buscar Série D:', compError);
      return;
    }

    console.log(`🏆 Série D encontrada: ${serieD.name} (ID: ${serieD.id})`);

    // Inscrever o time na Série D
    const { data: registration, error: regError } = await supabase
      .from('game_competition_teams')
      .insert({
        competition_id: serieD.id,
        team_id: newTeam.id
      })
      .select()
      .single();

    if (regError) {
      console.error('❌ Erro ao inscrever time na competição:', regError);
      return;
    }

    console.log(`✅ Time inscrito na competição: ${registration.id}`);

    // Atualizar contador de times na competição
    const { error: updateError } = await supabase
      .from('game_competitions')
      .update({ current_teams: serieD.current_teams + 1 })
      .eq('id', serieD.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar contador da competição:', updateError);
    } else {
      console.log('✅ Contador da competição atualizado');
    }

    // Criar entrada na classificação
    const { error: standingsError } = await supabase
      .from('game_standings')
      .insert({
        competition_id: serieD.id,
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
      console.error('❌ Erro ao criar entrada na classificação:', standingsError);
    } else {
      console.log('✅ Entrada na classificação criada');
    }

    console.log('\n🎉 Time de teste criado e inscrito com sucesso!');
    console.log(`📋 Resumo:`);
    console.log(`   - Time: ${newTeam.name}`);
    console.log(`   - Competição: ${serieD.name}`);
    console.log(`   - ID do time: ${newTeam.id}`);
    console.log(`   - ID da competição: ${serieD.id}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

criarTimeTeste(); 