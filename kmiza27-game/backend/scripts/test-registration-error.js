const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testRegistrationError() {
  console.log('🔍 DIAGNOSTICANDO ERRO DE REGISTRO EM COMPETIÇÃO');
  console.log('=' .repeat(60));

  try {
    const supabase = getSupabaseServiceClient();

    // 1. Verificar conectividade
    console.log('\n📡 1. TESTANDO CONECTIVIDADE...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('game_competitions')
      .select('count')
      .limit(1);

    if (healthError) {
      console.log('❌ Erro de conectividade:', healthError.message);
      return;
    }
    console.log('✅ Conectividade OK');

    // 2. Verificar tabelas necessárias
    console.log('\n📋 2. VERIFICANDO TABELAS NECESSÁRIAS...');
    
    const tables = [
      'game_competitions',
      'game_competition_teams', 
      'game_teams',
      'game_standings'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Acessível`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // 3. Verificar dados existentes
    console.log('\n📊 3. VERIFICANDO DADOS EXISTENTES...');
    
    // Competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, max_teams, current_teams');

    if (compError) {
      console.log('❌ Erro ao buscar competições:', compError.message);
    } else {
      console.log(`✅ Competições encontradas: ${competitions?.length || 0}`);
      competitions?.forEach(comp => {
        console.log(`   • ${comp.name}: ${comp.current_teams}/${comp.max_teams} times`);
      });
    }

    // Times
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, owner_id')
      .limit(5);

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
    } else {
      console.log(`✅ Times ativos encontrados: ${teams?.length || 0}`);
      teams?.forEach(team => {
        console.log(`   • ${team.name} (ID: ${team.id})`);
      });
    }

    // Inscrições existentes
    const { data: registrations, error: regError } = await supabase
      .from('game_competition_teams')
      .select('competition_id, team_id');

    if (regError) {
      console.log('❌ Erro ao buscar inscrições:', regError.message);
    } else {
      console.log(`✅ Inscrições existentes: ${registrations?.length || 0}`);
    }

    // 4. Simular registro
    console.log('\n🧪 4. SIMULANDO REGISTRO...');
    
    if (competitions && competitions.length > 0 && teams && teams.length > 0) {
      const testCompetition = competitions[0];
      const testTeam = teams[0];
      
      console.log(`   • Tentando registrar ${testTeam.name} em ${testCompetition.name}`);
      
      // Verificar se já está inscrito
      const { data: existingReg, error: checkError } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', testCompetition.id)
        .eq('team_id', testTeam.id)
        .single();

      if (existingReg) {
        console.log('   ⚠️  Time já está inscrito nesta competição');
      } else {
        console.log('   ✅ Time não está inscrito, pode ser registrado');
        
        // Tentar inserir
        const { data: insertResult, error: insertError } = await supabase
          .from('game_competition_teams')
          .insert({
            competition_id: testCompetition.id,
            team_id: testTeam.id
          })
          .select()
          .single();

        if (insertError) {
          console.log('   ❌ Erro ao inserir inscrição:', insertError.message);
          console.log('   📝 Detalhes do erro:', insertError);
        } else {
          console.log('   ✅ Inscrição criada com sucesso!');
          
          // Atualizar contador
          const { error: updateError } = await supabase
            .from('game_competitions')
            .update({ current_teams: testCompetition.current_teams + 1 })
            .eq('id', testCompetition.id);

          if (updateError) {
            console.log('   ⚠️  Erro ao atualizar contador:', updateError.message);
          } else {
            console.log('   ✅ Contador atualizado');
          }
        }
      }
    } else {
      console.log('   ⚠️  Não há competições ou times suficientes para teste');
    }

    // 5. Verificar estrutura da tabela
    console.log('\n🏗️  5. VERIFICANDO ESTRUTURA DA TABELA...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('game_competition_teams')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Erro ao verificar estrutura:', tableError.message);
    } else {
      console.log('✅ Estrutura da tabela game_competition_teams:');
      if (tableInfo && tableInfo.length > 0) {
        const columns = Object.keys(tableInfo[0]);
        columns.forEach(col => {
          console.log(`   • ${col}: ${typeof tableInfo[0][col]}`);
        });
      } else {
        console.log('   • Tabela vazia, mas acessível');
      }
    }

    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
  }
}

// Executar diagnóstico
testRegistrationError()
  .catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }); 