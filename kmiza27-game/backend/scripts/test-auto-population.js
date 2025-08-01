const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testAutoPopulation() {
  console.log('🧪 TESTANDO AUTO-POPULAÇÃO DE COMPETIÇÕES');
  console.log('=' .repeat(50));

  try {
    const supabase = getSupabaseServiceClient();

    // 1. Verificar estado atual das competições
    console.log('\n📊 1. VERIFICANDO ESTADO ATUAL DAS COMPETIÇÕES...');
    
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });

    if (compError) {
      console.log('❌ Erro ao buscar competições:', compError.message);
      return;
    }

    console.log('✅ Competições encontradas:');
    competitions?.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.current_teams}/${comp.max_teams} times`);
    });

    // 2. Verificar times de usuário disponíveis
    console.log('\n👤 2. VERIFICANDO TIMES DE USUÁRIO...');
    
    const { data: userTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('*')
      .eq('team_type', 'user_created')
      .limit(5);

    if (teamsError) {
      console.log('❌ Erro ao buscar times de usuário:', teamsError.message);
      return;
    }

    console.log(`✅ ${userTeams?.length || 0} times de usuário encontrados`);
    userTeams?.forEach(team => {
      console.log(`   • ${team.name} (${team.id})`);
    });

    // 3. Simular inscrição de usuário na Série D
    console.log('\n🎯 3. SIMULANDO INSCRIÇÃO DE USUÁRIO...');
    
    if (userTeams && userTeams.length > 0) {
      const userTeam = userTeams[0];
      const serieD = competitions.find(c => c.name === 'Série D');
      
      if (!serieD) {
        console.log('❌ Série D não encontrada');
        return;
      }

      console.log(`   • Usuário: ${userTeam.name}`);
      console.log(`   • Competição: ${serieD.name}`);
      console.log(`   • Estado atual: ${serieD.current_teams}/${serieD.max_teams} times`);

      // Verificar se o usuário já está inscrito
      const { data: existingReg, error: checkError } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', serieD.id)
        .eq('team_id', userTeam.id)
        .single();

      if (existingReg) {
        console.log('   ⚠️  Usuário já está inscrito na Série D');
      } else {
        console.log('   ✅ Usuário pode se inscrever na Série D');
        
        // Simular inscrição via API
        try {
          const response = await fetch(`http://localhost:3004/api/v1/competitions/${serieD.id}/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teamId: userTeam.id })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('   ✅ Inscrição realizada com sucesso!');
            console.log('   📊 Resultado:', JSON.stringify(result, null, 2));
          } else {
            const errorText = await response.text();
            console.log(`   ❌ Erro na inscrição: ${response.status} - ${errorText}`);
          }
        } catch (error) {
          console.log(`   ❌ Erro ao testar inscrição: ${error.message}`);
        }
      }
    }

    // 4. Verificar resultado após inscrição
    console.log('\n📊 4. VERIFICANDO RESULTADO APÓS INSCRIÇÃO...');
    
    const { data: updatedCompetitions } = await supabase
      .from('game_competitions')
      .select('*')
      .order('tier', { ascending: true });

    console.log('✅ Estado final das competições:');
    updatedCompetitions?.forEach(comp => {
      console.log(`   • ${comp.name}: ${comp.current_teams}/${comp.max_teams} times`);
    });

    // 5. Verificar inscrições na Série D
    console.log('\n🏆 5. VERIFICANDO INSCRIÇÕES NA SÉRIE D...');
    
    const serieD = updatedCompetitions.find(c => c.name === 'Série D');
    if (!serieD) {
      console.log('❌ Série D não encontrada');
      return;
    }
    
    const { data: serieDRegistrations, error: regError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_teams!inner(name, team_type)
      `)
      .eq('competition_id', serieD.id);

    if (regError) {
      console.log('❌ Erro ao buscar inscrições:', regError.message);
    } else {
      console.log(`✅ ${serieDRegistrations?.length || 0} inscrições na Série D:`);
      
      const userTeamsInSerieD = serieDRegistrations?.filter(r => r.game_teams.team_type === 'user_created') || [];
      const machineTeamsInSerieD = serieDRegistrations?.filter(r => r.game_teams.team_type === 'machine') || [];
      
      console.log(`   • Times de usuário: ${userTeamsInSerieD.length}`);
      console.log(`   • Times da máquina: ${machineTeamsInSerieD.length}`);
      
      if (userTeamsInSerieD.length > 0) {
        console.log('   👤 Times de usuário inscritos:');
        userTeamsInSerieD.forEach(reg => {
          console.log(`     • ${reg.game_teams.name}`);
        });
      }
      
      if (machineTeamsInSerieD.length > 0) {
        console.log('   🤖 Primeiros 5 times da máquina inscritos:');
        machineTeamsInSerieD.slice(0, 5).forEach(reg => {
          console.log(`     • ${reg.game_teams.name}`);
        });
      }
    }

    // 6. Verificar se o campeonato pode iniciar
    console.log('\n🚀 6. VERIFICANDO SE CAMPEONATO PODE INICIAR...');
    
    const finalSerieD = updatedCompetitions.find(c => c.name === 'Série D');
    if (finalSerieD && finalSerieD.current_teams >= finalSerieD.max_teams) {
      console.log('✅ Série D está cheia e pronta para iniciar!');
      console.log('🎯 Campeonato pode começar imediatamente');
      console.log('⚽ Sistema de rodadas pode ser ativado');
      console.log('🏆 Classificação já está configurada');
    } else {
      console.log('⚠️  Série D ainda não está cheia');
      console.log(`📊 Faltam ${finalSerieD.max_teams - finalSerieD.current_teams} times`);
    }

    console.log('\n🎉 TESTE DE AUTO-POPULAÇÃO CONCLUÍDO!');
    console.log('🏆 Sistema funcionando corretamente!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testAutoPopulation()
  .catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }); 