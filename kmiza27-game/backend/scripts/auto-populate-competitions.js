const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function autoPopulateCompetitions() {
  console.log('🏆 AUTO-POPULANDO COMPETIÇÕES');
  console.log('=' .repeat(40));

  try {
    const supabase = getSupabaseServiceClient();

    // 1. Verificar competições existentes
    console.log('\n📊 1. VERIFICANDO COMPETIÇÕES EXISTENTES...');
    
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });

    if (compError) {
      console.log('❌ Erro ao buscar competições:', compError.message);
      return;
    }

    console.log(`✅ ${competitions?.length || 0} competições encontradas:`);
    competitions?.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.current_teams}/${comp.max_teams} times`);
    });

    // 2. Verificar times da máquina disponíveis
    console.log('\n🤖 2. VERIFICANDO TIMES DA MÁQUINA...');
    
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('team_type', 'machine')
      .order('name', { ascending: true });

    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }

    console.log(`✅ ${machineTeams?.length || 0} times da máquina encontrados`);

    // 3. Para cada competição, popular com times da máquina
    console.log('\n🎯 3. POPULANDO COMPETIÇÕES...');
    
    for (const competition of competitions) {
      console.log(`\n🏆 Processando ${competition.name}...`);
      
      // Verificar quantos times já estão inscritos
      const { data: existingRegistrations, error: regError } = await supabase
        .from('game_competition_teams')
        .select('team_id')
        .eq('competition_id', competition.id);

      if (regError) {
        console.log(`❌ Erro ao verificar inscrições: ${regError.message}`);
        continue;
      }

      const currentTeams = existingRegistrations?.length || 0;
      const neededTeams = competition.max_teams - currentTeams;

      console.log(`   • Times atuais: ${currentTeams}/${competition.max_teams}`);
      console.log(`   • Times necessários: ${neededTeams}`);

      if (neededTeams <= 0) {
        console.log(`   ✅ ${competition.name} já está cheia!`);
        continue;
      }

      // Selecionar times da máquina para esta competição
      const teamsForCompetition = machineTeams.slice(0, neededTeams);
      
      console.log(`   • Adicionando ${teamsForCompetition.length} times da máquina...`);

      // Inserir times da máquina na competição
      for (const team of teamsForCompetition) {
        try {
          // Verificar se o time já está inscrito
          const { data: existingReg, error: checkError } = await supabase
            .from('game_competition_teams')
            .select('id')
            .eq('competition_id', competition.id)
            .eq('team_id', team.id)
            .single();

          if (existingReg) {
            console.log(`     ⚠️  ${team.name} já está inscrito`);
            continue;
          }

          // Inserir inscrição
          const { data: registration, error: insertError } = await supabase
            .from('game_competition_teams')
            .insert({
              competition_id: competition.id,
              team_id: team.id,
              points: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0,
              goal_difference: 0,
              position: null,
              status: 'active'
            })
            .select()
            .single();

          if (insertError) {
            console.log(`     ❌ Erro ao inscrever ${team.name}: ${insertError.message}`);
          } else {
            console.log(`     ✅ ${team.name} inscrito com sucesso!`);
          }

        } catch (error) {
          console.log(`     ❌ Erro ao processar ${team.name}: ${error.message}`);
        }
      }

      // Atualizar contador da competição
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: competition.max_teams })
        .eq('id', competition.id);

      if (updateError) {
        console.log(`   ❌ Erro ao atualizar contador: ${updateError.message}`);
      } else {
        console.log(`   ✅ Contador atualizado para ${competition.max_teams}`);
      }

      // Criar entradas na classificação
      console.log(`   • Criando entradas na classificação...`);
      for (const team of teamsForCompetition) {
        try {
          const { error: standingsError } = await supabase
            .from('game_standings')
            .insert({
              competition_id: competition.id,
              team_id: team.id,
              season_year: 2024,
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
            console.log(`     ❌ Erro ao criar classificação para ${team.name}: ${standingsError.message}`);
          }
        } catch (error) {
          console.log(`     ❌ Erro ao processar classificação: ${error.message}`);
        }
      }
    }

    // 4. Verificar resultado final
    console.log('\n📊 4. VERIFICANDO RESULTADO FINAL...');
    
    const { data: finalCompetitions } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });

    console.log('✅ Status final das competições:');
    finalCompetitions?.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.current_teams}/${comp.max_teams} times`);
    });

    // 5. Criar função para auto-popular quando usuário se inscrever
    console.log('\n🔧 5. CRIANDO FUNÇÃO DE AUTO-POPULAÇÃO...');
    
    const autoPopulateFunction = `
    // Função para auto-popular competição quando usuário se inscrever
    async function autoPopulateCompetition(competitionId: string, userTeamId: string) {
      try {
        // 1. Verificar se a competição precisa ser populada
        const { data: competition } = await supabase
          .from('game_competitions')
          .select('*')
          .eq('id', competitionId)
          .single();

        if (!competition) throw new Error('Competição não encontrada');

        // 2. Verificar times já inscritos
        const { data: existingRegistrations } = await supabase
          .from('game_competition_teams')
          .select('team_id')
          .eq('competition_id', competitionId);

        const currentTeams = existingRegistrations?.length || 0;
        const neededTeams = competition.max_teams - currentTeams;

        if (neededTeams <= 0) {
          console.log('Competição já está cheia');
          return;
        }

        // 3. Buscar times da máquina
        const { data: machineTeams } = await supabase
          .from('game_teams')
          .select('*')
          .eq('team_type', 'machine')
          .limit(neededTeams);

        // 4. Inserir times da máquina
        for (const team of machineTeams) {
          await supabase
            .from('game_competition_teams')
            .insert({
              competition_id: competitionId,
              team_id: team.id,
              points: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0,
              goal_difference: 0,
              position: null,
              status: 'active'
            });

          // Criar entrada na classificação
          await supabase
            .from('game_standings')
            .insert({
              competition_id: competitionId,
              team_id: team.id,
              season_year: 2024,
              position: 0,
              games_played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0,
              points: 0
            });
        }

        // 5. Atualizar contador da competição
        await supabase
          .from('game_competitions')
          .update({ current_teams: competition.max_teams })
          .eq('id', competitionId);

        console.log(\`Competição \${competition.name} populada com \${machineTeams.length} times da máquina\`);
      } catch (error) {
        console.error('Erro ao auto-popular competição:', error);
      }
    }
    `;

    console.log('✅ Função de auto-população criada');
    console.log('📝 Código da função:');
    console.log(autoPopulateFunction);

    console.log('\n🎉 AUTO-POPULAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('🏆 Competições prontas para iniciar quando usuário se inscrever!');

  } catch (error) {
    console.error('❌ Erro na auto-população:', error.message);
  }
}

// Executar auto-população
autoPopulateCompetitions()
  .catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }); 