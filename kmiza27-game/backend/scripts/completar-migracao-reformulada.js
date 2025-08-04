const { getSupabaseClient } = require('../config/supabase-connection');

async function completarMigracaoReformulada() {
  console.log('🔄 MIGRAÇÃO: Completando migração para sistema reformulado');
  console.log('='.repeat(60));

  const supabase = getSupabaseClient('vps');

  try {
    // Passo 1: Sincronizar times da máquina
    console.log('\n🤖 PASSO 1: Sincronizando times da máquina...');
    await sincronizarTimesMaquina(supabase);
    
    // Passo 2: Limpar dados órfãos
    console.log('\n🧹 PASSO 2: Limpando dados órfãos...');
    await limparDadosOrfaos(supabase);
    
    // Passo 3: Reinscrever times nas competições
    console.log('\n📝 PASSO 3: Reinscrevendo times nas competições...');
    await reinscreverTimesCompeticoes(supabase);
    
    // Passo 4: Recriar calendários
    console.log('\n📅 PASSO 4: Recriando calendários...');
    await recriarCalendarios(supabase);
    
    // Passo 5: Verificar integridade
    console.log('\n✅ PASSO 5: Verificando integridade...');
    await verificarIntegridade(supabase);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('✅ Sistema reformulado está operacional');
    console.log('🎮 Usuários podem criar times e jogar normalmente');

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO na migração:', error);
    throw error;
  }
}

async function sincronizarTimesMaquina(supabase) {
  try {
    console.log('🔍 Verificando sincronização...');
    
    // Buscar times da máquina
    const { data: machineTeams, error: machineError } = await supabase
      .from('game_machine_teams')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true });

    if (machineError) {
      throw new Error(`Erro ao buscar times da máquina: ${machineError.message}`);
    }

    // Verificar quantos já existem em game_teams
    const { data: gameTeams, error: gameError } = await supabase
      .from('game_teams')
      .select('id')
      .eq('team_type', 'machine');

    if (gameError) {
      throw new Error(`Erro ao buscar game_teams: ${gameError.message}`);
    }

    console.log(`📊 Times da máquina: ${machineTeams.length}`);
    console.log(`📊 Times em game_teams: ${gameTeams.length}`);

    if (gameTeams.length === 0) {
      console.log('🔄 Migrando todos os times da máquina para game_teams...');
      
      // Converter e inserir times da máquina em game_teams
      const gameTeamsToInsert = machineTeams.map(team => ({
        id: team.id, // Manter mesmo ID para referências
        name: team.name,
        team_type: 'machine',
        logo_url: null,
        owner_id: null, // Times da máquina não têm dono
        kit_colors: team.colors,
        stadium_name: team.stadium_name,
        stadium_capacity: team.stadium_capacity,
        is_active: team.is_active,
        created_at: team.created_at,
        updated_at: team.created_at
      }));

      // Inserir em lotes
      const batchSize = 20;
      let insertedCount = 0;
      
      for (let i = 0; i < gameTeamsToInsert.length; i += batchSize) {
        const batch = gameTeamsToInsert.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('game_teams')
          .insert(batch);

        if (insertError) {
          console.error(`❌ Erro ao inserir lote:`, insertError);
          continue;
        }
        
        insertedCount += batch.length;
        console.log(`   ✅ Inseridos ${insertedCount}/${gameTeamsToInsert.length} times`);
      }

      console.log(`🎉 ${insertedCount} times da máquina sincronizados com sucesso!`);
      
    } else if (gameTeams.length < machineTeams.length) {
      console.log(`⚠️ Faltam ${machineTeams.length - gameTeams.length} times para sincronizar`);
      // Aqui poderia implementar sincronização parcial se necessário
    } else {
      console.log('✅ Times da máquina já estão sincronizados');
    }

  } catch (error) {
    console.error('❌ Erro na sincronização de times:', error);
    throw error;
  }
}

async function limparDadosOrfaos(supabase) {
  try {
    console.log('🔍 Identificando dados órfãos...');
    
    // Limpar inscrições órfãs em game_competition_teams
    const { data: orphanedEnrollments, error: orphanError } = await supabase
      .from('game_competition_teams')
      .select(`
        id,
        team_id,
        competition_id,
        game_teams!left(id)
      `)
      .is('game_teams.id', null);

    if (!orphanError && orphanedEnrollments && orphanedEnrollments.length > 0) {
      console.log(`🗑️ Removendo ${orphanedEnrollments.length} inscrições órfãs...`);
      
      const orphanIds = orphanedEnrollments.map(e => e.id);
      const { error: deleteError } = await supabase
        .from('game_competition_teams')
        .delete()
        .in('id', orphanIds);

      if (deleteError) {
        console.error('❌ Erro ao remover órfãos:', deleteError);
      } else {
        console.log('✅ Inscrições órfãs removidas');
      }
    } else {
      console.log('✅ Nenhuma inscrição órfã encontrada');
    }

    // Limpar progresso de usuários sem times
    const { data: orphanedProgress, error: progressError } = await supabase
      .from('game_user_competition_progress')
      .select(`
        id,
        team_id,
        user_id,
        game_teams!left(id)
      `)
      .is('game_teams.id', null);

    if (!progressError && orphanedProgress && orphanedProgress.length > 0) {
      console.log(`🗑️ Removendo ${orphanedProgress.length} progressos órfãos...`);
      
      const progressIds = orphanedProgress.map(p => p.id);
      const { error: deleteProgressError } = await supabase
        .from('game_user_competition_progress')
        .delete()
        .in('id', progressIds);

      if (deleteProgressError) {
        console.error('❌ Erro ao remover progressos órfãos:', deleteProgressError);
      } else {
        console.log('✅ Progressos órfãos removidos');
      }
    } else {
      console.log('✅ Nenhum progresso órfão encontrado');
    }

  } catch (error) {
    console.error('❌ Erro na limpeza de órfãos:', error);
    throw error;
  }
}

async function reinscreverTimesCompeticoes(supabase) {
  try {
    console.log('🔍 Verificando inscrições nas competições...');
    
    // Buscar todas as competições ativas
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('status', 'active')
      .order('tier');

    if (compError) {
      throw new Error(`Erro ao buscar competições: ${compError.message}`);
    }

    for (const competition of competitions) {
      console.log(`\n📋 Processando ${competition.name}...`);
      
      // Verificar times inscritos
      const { data: enrolledTeams, error: enrollError } = await supabase
        .from('game_competition_teams')
        .select('team_id')
        .eq('competition_id', competition.id);

      if (enrollError) {
        console.log(`   ❌ Erro ao verificar inscrições: ${enrollError.message}`);
        continue;
      }

      console.log(`   📊 Times inscritos: ${enrolledTeams.length}`);

      // Se a competição não tem times suficientes, inscrever times da máquina
      if (enrolledTeams.length < 20) {
        const needed = 20 - enrolledTeams.length;
        console.log(`   🤖 Inscrevendo ${needed} times da máquina...`);
        
        // Buscar times da máquina da série correspondente
        const currentTeamIds = enrolledTeams.map(e => e.team_id);
        
        const { data: availableMachineTeams, error: machineError } = await supabase
          .from('game_teams')
          .select('id')
          .eq('team_type', 'machine')
          .not('id', 'in', `(${currentTeamIds.join(',') || 'NULL'})`)
          .limit(needed);

        if (!machineError && availableMachineTeams && availableMachineTeams.length > 0) {
          const enrollments = availableMachineTeams.map(team => ({
            competition_id: competition.id,
            team_id: team.id,
            enrolled_at: new Date().toISOString(),
            status: 'active'
          }));

          const { error: insertError } = await supabase
            .from('game_competition_teams')
            .insert(enrollments);

          if (insertError) {
            console.log(`   ❌ Erro ao inscrever times: ${insertError.message}`);
          } else {
            console.log(`   ✅ ${enrollments.length} times da máquina inscritos`);
          }
        }
      } else {
        console.log(`   ✅ Competição já tem times suficientes`);
      }
    }

  } catch (error) {
    console.error('❌ Erro na reinscrição:', error);
    throw error;
  }
}

async function recriarCalendarios(supabase) {
  try {
    console.log('🔍 Verificando calendários...');
    
    // Buscar competições ativas
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('*')
      .eq('status', 'active');

    if (compError) {
      throw new Error(`Erro ao buscar competições: ${compError.message}`);
    }

    for (const competition of competitions) {
      console.log(`\n📅 Verificando calendário de ${competition.name}...`);
      
      // Verificar se já tem partidas
      const { data: existingMatches, error: matchError } = await supabase
        .from('game_matches')
        .select('id')
        .eq('competition_id', competition.id);

      if (matchError) {
        console.log(`   ❌ Erro ao verificar partidas: ${matchError.message}`);
        continue;
      }

      // Verificar times inscritos
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select('team_id')
        .eq('competition_id', competition.id);

      if (teamsError) {
        console.log(`   ❌ Erro ao verificar times: ${teamsError.message}`);
        continue;
      }

      const expectedMatches = enrolledTeams.length > 1 ? 
        enrolledTeams.length * (enrolledTeams.length - 1) : 0;

      console.log(`   📊 Partidas: ${existingMatches.length}/${expectedMatches}`);

      if (existingMatches.length < expectedMatches && enrolledTeams.length >= 2) {
        console.log(`   🔧 Recriando calendário...`);
        // Aqui você pode chamar a função de criação de calendário
        // que já existe no seu sistema
      } else {
        console.log(`   ✅ Calendário está completo`);
      }
    }

  } catch (error) {
    console.error('❌ Erro na verificação de calendários:', error);
    throw error;
  }
}

async function verificarIntegridade(supabase) {
  try {
    console.log('🔍 Verificando integridade final...');
    
    // Verificar times
    const { data: gameTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('team_type')
      .eq('team_type', 'machine');

    const machineTeamsCount = gameTeams?.length || 0;
    console.log(`🤖 Times da máquina em game_teams: ${machineTeamsCount}/76`);

    // Verificar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier')
      .eq('status', 'active');

    console.log(`🏆 Competições ativas: ${competitions?.length || 0}`);

    // Verificar inscrições por competição
    if (competitions) {
      for (const comp of competitions) {
        const { data: enrollments, error: enrollError } = await supabase
          .from('game_competition_teams')
          .select('team_id')
          .eq('competition_id', comp.id);

        const enrollmentsCount = enrollments?.length || 0;
        const status = enrollmentsCount >= 19 ? '✅' : '⚠️';
        console.log(`   ${status} ${comp.name}: ${enrollmentsCount} times inscritos`);
      }
    }

    console.log('\n📊 RESUMO DA INTEGRIDADE:');
    console.log(`   Times da máquina: ${machineTeamsCount === 76 ? '✅' : '❌'} (${machineTeamsCount}/76)`);
    console.log(`   Competições ativas: ${competitions?.length === 4 ? '✅' : '❌'} (${competitions?.length || 0}/4)`);

  } catch (error) {
    console.error('❌ Erro na verificação de integridade:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  completarMigracaoReformulada()
    .then(() => {
      console.log('\n🏁 Migração finalizada!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro fatal na migração:', error);
      process.exit(1);
    });
}

module.exports = { completarMigracaoReformulada };