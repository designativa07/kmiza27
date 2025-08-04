const { getSupabaseServiceClient } = require('../config/supabase-connection');
const supabase = getSupabaseServiceClient('vps');

async function cleanOrphanedUsers() {
  console.log('🧹 LIMPANDO USUÁRIOS ÓRFÃOS');
  console.log('======================================================================\n');

  try {
    // 1. Buscar todos os usuários
    console.log('📋 Passo 1: Buscando todos os usuários...');
    const { data: allUsers, error: usersError } = await supabase
      .from('game_users')
      .select('id, username');

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    console.log(`✅ Encontrados ${allUsers.length} usuários no total`);

    // 2. Verificar quais usuários têm times ativos
    console.log('\n📋 Passo 2: Verificando usuários com times ativos...');
    const usersWithTeams = [];
    const orphanedUsers = [];

    for (const user of allUsers) {
      const { data: teams, error: teamsError } = await supabase
        .from('game_teams')
        .select('id, name')
        .eq('owner_id', user.id);

      if (teamsError) {
        console.log(`   ⚠️ Erro ao verificar times do usuário ${user.username}:`, teamsError.message);
        continue;
      }

      if (teams && teams.length > 0) {
        usersWithTeams.push({
          user: user,
          teams: teams
        });
        console.log(`   ✅ ${user.username} - ${teams.length} time(s)`);
      } else {
        orphanedUsers.push(user);
        console.log(`   ❌ ${user.username} - SEM TIMES (ÓRFÃO)`);
      }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`   - Usuários com times: ${usersWithTeams.length}`);
    console.log(`   - Usuários órfãos: ${orphanedUsers.length}`);

    if (orphanedUsers.length === 0) {
      console.log('\n🎉 Nenhum usuário órfão encontrado!');
      return;
    }

    // 3. Mostrar usuários órfãos
    console.log('\n📋 Passo 3: Usuários órfãos encontrados:');
    orphanedUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.id})`);
    });

    // 4. Perguntar se deve deletar
    console.log('\n⚠️ ATENÇÃO: Estes usuários não têm times ativos.');
    console.log('💡 Recomendação: Deletar usuários órfãos para limpar o banco.');
    console.log('💡 Isso também deletará suas estatísticas dos times da máquina.');
    
    // Simular confirmação (em produção, você pode implementar uma interface)
    const shouldDelete = true; // Você pode mudar para false se quiser testar primeiro
    
    if (!shouldDelete) {
      console.log('\n⏸️ Operação cancelada pelo usuário.');
      return;
    }

    // 5. Deletar usuários órfãos
    console.log('\n📋 Passo 4: Deletando usuários órfãos...');
    let deletedCount = 0;
    let errorCount = 0;

    for (const user of orphanedUsers) {
      try {
        // Deletar estatísticas dos times da máquina primeiro (devido à foreign key)
        const { error: statsError } = await supabase
          .from('game_user_machine_team_stats')
          .delete()
          .eq('user_id', user.id);

        if (statsError) {
          console.log(`   ⚠️ Erro ao deletar stats de ${user.username}:`, statsError.message);
        } else {
          console.log(`   ✅ Stats deletados para ${user.username}`);
        }

        // Deletar o usuário
        const { error: userError } = await supabase
          .from('game_users')
          .delete()
          .eq('id', user.id);

        if (userError) {
          console.log(`   ❌ Erro ao deletar usuário ${user.username}:`, userError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Usuário ${user.username} deletado`);
          deletedCount++;
        }
      } catch (error) {
        console.log(`   ❌ Erro ao processar ${user.username}:`, error.message);
        errorCount++;
      }
    }

    // 6. Resultado final
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`   - Usuários deletados: ${deletedCount}`);
    console.log(`   - Erros: ${errorCount}`);
    console.log(`   - Total de órfãos: ${orphanedUsers.length}`);

    if (deletedCount > 0) {
      console.log('\n🎉 Limpeza concluída!');
      console.log('💡 Agora o sistema está mais limpo e organizado.');
    } else {
      console.log('\n⚠️ Nenhum usuário foi deletado.');
    }

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
cleanOrphanedUsers(); 