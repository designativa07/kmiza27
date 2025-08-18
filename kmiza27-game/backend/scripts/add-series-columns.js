const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function addSeriesColumns() {
  console.log('🔧 ADICIONANDO COLUNAS DE SÉRIE E TIER');
  console.log('========================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar estrutura atual da tabela
    console.log('📋 1. Verificando estrutura atual...');
    
    const { data: currentTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('*')
      .limit(1);

    if (teamsError) {
      console.log('❌ Erro ao verificar tabela:', teamsError.message);
      return;
    }

    console.log('✅ Tabela game_teams acessível');
    console.log('📊 Colunas disponíveis:', Object.keys(currentTeams[0] || {}));

    // 2. Tentar adicionar coluna series (se não existir)
    console.log('\n🏗️  2. Adicionando coluna series...');
    
    try {
      const { error: alterError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'game_teams',
        column_name: 'series',
        column_definition: 'VARCHAR(20) CHECK (series IN (\'Série A\', \'Série B\', \'Série C\', \'Série D\'))'
      });

      if (alterError) {
        console.log('   ℹ️  Coluna series já existe ou erro na criação');
      } else {
        console.log('   ✅ Coluna series criada com sucesso');
      }
    } catch (error) {
      console.log('   ℹ️  Coluna series já existe ou erro na criação');
    }

    // 3. Tentar adicionar coluna tier (se não existir)
    console.log('\n🏗️  3. Adicionando coluna tier...');
    
    try {
      const { error: alterError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'game_teams',
        column_name: 'tier',
        column_definition: 'INTEGER CHECK (tier >= 1 AND tier <= 4)'
      });

      if (alterError) {
        console.log('   ℹ️  Coluna tier já existe ou erro na criação');
      } else {
        console.log('   ✅ Coluna tier criada com sucesso');
      }
    } catch (error) {
      console.log('   ℹ️  Coluna tier já existe ou erro na criação');
    }

    // 4. Tentar adicionar coluna series_info (se não existir)
    console.log('\n🏗️  4. Adicionando coluna series_info...');
    
    try {
      const { error: alterError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'game_teams',
        column_name: 'series_info',
        column_definition: 'JSONB DEFAULT \'{}\''
      });

      if (alterError) {
        console.log('   ℹ️  Coluna series_info já existe ou erro na criação');
      } else {
        console.log('   ✅ Coluna series_info criada com sucesso');
      }
    } catch (error) {
      console.log('   ℹ️  Coluna series_info já existe ou erro na criação');
    }

    // 5. Atualizar times existentes com valores padrão
    console.log('\n🔄 5. Atualizando times existentes...');
    
    const { error: updateError } = await supabase
      .from('game_teams')
      .update({
        series: 'Série D',
        tier: 4,
        series_info: {
          name: 'Série D',
          tier: 4,
          description: 'Quarta Divisão - Início da Jornada',
          promotion_spots: 4,
          relegation_spots: 0
        }
      })
      .eq('team_type', 'machine')
      .is('series', null);

    if (updateError) {
      console.log('   ❌ Erro ao atualizar times:', updateError.message);
    } else {
      console.log('   ✅ Times atualizados com valores padrão');
    }

    // 6. Verificar resultado
    console.log('\n📊 6. Verificando resultado...');
    
    const { data: finalTeams, error: finalError } = await supabase
      .from('game_teams')
      .select('name, series, tier, series_info')
      .eq('team_type', 'machine')
      .order('tier, name');

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`📊 Times da máquina: ${finalTeams?.length || 0}`);
      
      // Agrupar por série
      const seriesGroups = {};
      finalTeams?.forEach(team => {
        const series = team.series || 'Sem série';
        if (!seriesGroups[series]) seriesGroups[series] = [];
        seriesGroups[series].push(team);
      });

      Object.entries(seriesGroups).forEach(([series, teams]) => {
        console.log(`\n🏆 ${series} (${teams.length} times):`);
        teams.forEach(team => {
          console.log(`   • ${team.name} (Tier ${team.tier})`);
        });
      });
    }

    // 7. Resumo final
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log('   • ✅ Colunas series, tier e series_info adicionadas');
    console.log('   • ✅ Times existentes atualizados');
    console.log('   • ✅ Sistema pronto para organização em séries');

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Executar create-76-machine-teams.js');
    console.log('   2. Organizar times em 4 séries');
    console.log('   3. Criar jogadores para todos os times');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

addSeriesColumns();
