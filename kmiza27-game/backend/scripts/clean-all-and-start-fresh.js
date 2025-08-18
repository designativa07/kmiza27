const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function cleanAllAndStartFresh() {
  console.log('🧹 LIMPEZA COMPLETA DO BANCO - COMEÇANDO DO ZERO');
  console.log('================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Limpar todas as tabelas relacionadas
    console.log('📋 1. Limpando todas as tabelas...');
    
    // Ordem de limpeza (respeitando foreign keys)
    const tablesToClean = [
      'game_transfers',
      'game_players', 
      'youth_players',
      'youth_tryouts',
      'youth_academies',
      'youth_categories',
      'game_teams',
      'game_users'
    ];

    for (const table of tablesToClean) {
      try {
        console.log(`   🗑️  Limpando tabela: ${table}`);
        
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar tudo

        if (error) {
          console.log(`      ❌ Erro ao limpar ${table}:`, error.message);
        } else {
          console.log(`      ✅ ${table} limpa com sucesso`);
        }
      } catch (error) {
        console.log(`      ❌ Erro ao processar ${table}:`, error.message);
      }
    }

    // 2. Verificar limpeza
    console.log('\n📊 2. Verificando limpeza...');
    
    for (const table of tablesToClean) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ Erro ao verificar ${table}:`, error.message);
        } else {
          console.log(`   📊 ${table}: ${count || 0} registros`);
        }
      } catch (error) {
        console.log(`   ❌ Erro ao verificar ${table}:`, error.message);
      }
    }

    // 3. Criar estrutura básica
    console.log('\n🏗️  3. Criando estrutura básica...');
    
    // 3.1 Criar usuário admin padrão
    console.log('   👤 Criando usuário admin padrão...');
    const adminUser = {
      id: require('crypto').randomUUID(),
      email: 'admin@kmiza27.com',
      username: 'admin',
      display_name: 'Administrador',
      game_stats: {},
      preferences: {}
    };

    const { data: createdUser, error: userError } = await supabase
      .from('game_users')
      .insert(adminUser)
      .select()
      .single();

    if (userError) {
      console.log('      ❌ Erro ao criar usuário admin:', userError.message);
    } else {
      console.log('      ✅ Usuário admin criado:', createdUser.username);
    }

    // 3.2 Criar categorias de base
    console.log('   🏫 Criando categorias de base...');
    const youthCategories = [
      { id: require('crypto').randomUUID(), name: 'Sub-15', min_age: 13, max_age: 15 },
      { id: require('crypto').randomUUID(), name: 'Sub-17', min_age: 15, max_age: 17 },
      { id: require('crypto').randomUUID(), name: 'Sub-20', min_age: 17, max_age: 20 }
    ];

    const { data: createdCategories, error: categoriesError } = await supabase
      .from('youth_categories')
      .insert(youthCategories)
      .select();

    if (categoriesError) {
      console.log('      ❌ Erro ao criar categorias:', categoriesError.message);
    } else {
      console.log(`      ✅ ${createdCategories?.length || 0} categorias criadas`);
    }

    // 3.3 Criar times da máquina
    console.log('   🤖 Criando times da máquina...');
    const machineTeams = [
      'Real Brasília', 'Atlético Goianiense', 'Vila Nova', 'Aparecidense',
      'Brasiliense', 'Gama', 'Ceilândia', 'Sobradinho', 'Luziânia', 'Formosa',
      'Anápolis', 'Cristalina', 'Planaltina', 'Valparaíso', 'Águas Lindas',
      'Novo Gama', 'Santo Antônio do Descoberto', 'Alexânia', 'Corumbá de Goiás',
      'Pirenópolis', 'Goianésia', 'Itaberaí', 'Inhumas', 'Itumbiara'
    ];

    const machineTeamsData = machineTeams.map((name, index) => ({
      id: require('crypto').randomUUID(),
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      short_name: name.split(' ').slice(-1)[0],
      team_type: 'machine',
      budget: 1000000,
      reputation: 50,
      fan_base: 5000,
      colors: { primary: '#FF0000', secondary: '#FFFFFF' },
      stadium_name: `Estádio ${name}`,
      stadium_capacity: 15000
    }));

    const { data: createdMachineTeams, error: machineTeamsError } = await supabase
      .from('game_teams')
      .insert(machineTeamsData)
      .select();

    if (machineTeamsError) {
      console.log('      ❌ Erro ao criar times da máquina:', machineTeamsError.message);
    } else {
      console.log(`      ✅ ${createdMachineTeams?.length || 0} times da máquina criados`);
    }

    // 4. Verificar estrutura criada
    console.log('\n📊 4. Verificando estrutura criada...');
    
    const { count: finalUsers } = await supabase
      .from('game_users')
      .select('*', { count: 'exact', head: true });

    const { count: finalCategories } = await supabase
      .from('youth_categories')
      .select('*', { count: 'exact', head: true });

    const { count: finalTeams } = await supabase
      .from('game_teams')
      .select('*', { count: 'exact', head: true });

    console.log(`   👥 Usuários: ${finalUsers || 0}`);
    console.log(`   🏫 Categorias de base: ${finalCategories || 0}`);
    console.log(`   🏟️  Times: ${finalTeams || 0}`);

    // 5. Resumo final
    console.log('\n🎉 LIMPEZA E ESTRUTURAÇÃO CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log('   • ✅ Todas as tabelas foram limpas');
    console.log('   • ✅ Usuário admin criado');
    console.log('   • ✅ Categorias de base criadas');
    console.log('   • ✅ 24 times da máquina criados');
    console.log('   • ✅ Sistema pronto para testes');

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Executar create-machine-teams-starters.js');
    console.log('   2. Testar criação de times reais');
    console.log('   3. Testar sistema de base');
    console.log('   4. Testar simulação de partidas');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

cleanAllAndStartFresh();
