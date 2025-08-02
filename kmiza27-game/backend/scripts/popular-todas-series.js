const { createClient } = require('@supabase/supabase-js');

// Definir variáveis de ambiente diretamente
const SUPABASE_URL = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

console.log('🔧 Conectando ao Supabase...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function popularTodasSeries() {
  console.log('🎯 Populando todas as séries com times da máquina...\n');

  try {
    // Buscar todas as competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });

    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }

    console.log(`📋 Encontradas ${competitions.length} competições`);

    // Nomes dos times por série
    const teamNamesByTier = {
      1: [ // Série A
        'Flamengo', 'Palmeiras', 'Santos', 'Corinthians', 'São Paulo',
        'Grêmio', 'Internacional', 'Atlético-MG', 'Cruzeiro', 'Bahia',
        'Vitória', 'Sport', 'Náutico', 'Santa Cruz', 'Ceará',
        'Fortaleza', 'Brasil de Pelotas', 'Avaí', 'Chapecoense'
      ],
      2: [ // Série B
        'Botafogo', 'Vasco', 'Fluminense', 'Atlético-PR', 'Coritiba',
        'Ponte Preta', 'Guarani', 'Bragantino', 'Ituano', 'Mirassol',
        'Novorizontino', 'Santo André', 'São Caetano', 'Portuguesa',
        'Comercial', 'XV de Piracicaba', 'Rio Branco', 'União Barbarense', 'Linense'
      ],
      3: [ // Série C
        'América-MG', 'Tombense', 'Villa Nova', 'Democrata', 'Tupi',
        'Ipatinga', 'Uberlândia', 'Araxá', 'Patrocinense', 'Boa',
        'Tupi-MG', 'Betim', 'Itabirito', 'Formiga', 'Pouso Alegre',
        'Guaxupé', 'Poços de Caldas', 'Varginha', 'Lavras'
      ],
      4: [ // Série D
        'Botafogo-RJ', 'Vasco-RJ', 'Fluminense-RJ', 'Flamengo-RJ', 'Palmeiras-SP',
        'Santos-SP', 'Corinthians-SP', 'São Paulo-SP', 'Grêmio-RS', 'Internacional-RS',
        'Atlético-MG', 'Cruzeiro-MG', 'Bahia-BA', 'Vitória-BA', 'Sport-PE',
        'Náutico-PE', 'Santa Cruz-PE', 'Ceará-CE', 'Fortaleza-CE'
      ]
    };

    for (const competition of competitions) {
      console.log(`\n🏆 Processando ${competition.name} (Tier ${competition.tier})`);
      
      // Verificar se já há times inscritos
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select('team_id')
        .eq('competition_id', competition.id);

      if (teamsError) {
        console.error(`❌ Erro ao buscar times da ${competition.name}:`, teamsError);
        continue;
      }

      const currentTeams = enrolledTeams.length;
      console.log(`   - Times atuais: ${currentTeams}/${competition.max_teams}`);

      if (currentTeams >= 19) {
        console.log(`   ✅ ${competition.name} já tem times suficientes`);
        continue;
      }

      const teamsNeeded = 19 - currentTeams;
      console.log(`   📝 Precisamos adicionar ${teamsNeeded} times`);

      const teamNames = teamNamesByTier[competition.tier] || [];
      
      for (let i = 0; i < teamsNeeded; i++) {
        const teamName = teamNames[i] || `Time ${competition.name} ${i + 1}`;
        
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

        console.log(`   ✅ Time criado: ${newTeam.name} (ID: ${newTeam.id})`);

        // Inscrever na competição
        const { error: insertError } = await supabase
          .from('game_competition_teams')
          .insert({
            competition_id: competition.id,
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
            competition_id: competition.id,
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

        console.log(`   ✅ ${teamName} inscrito na ${competition.name}`);
      }

      // Atualizar contador da competição
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: 19 })
        .eq('id', competition.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar contador da ${competition.name}:`, updateError);
      } else {
        console.log(`   ✅ Contador da ${competition.name} atualizado para 19 times`);
      }
    }

    console.log('\n🎉 Todas as séries foram populadas com sucesso!');
    console.log('📋 Resumo:');
    console.log('   - Cada série agora tem 19 times da máquina');
    console.log('   - 1 vaga disponível para times de usuários em cada série');
    console.log('   - Times podem se inscrever e começar a jogar');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

popularTodasSeries(); 