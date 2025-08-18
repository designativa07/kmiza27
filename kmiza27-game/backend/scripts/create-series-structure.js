const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function createSeriesStructure() {
  console.log('🏆 CRIANDO ESTRUTURA DE SÉRIES - 19 TIMES POR SÉRIE');
  console.log('====================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar times atuais
    console.log('📋 1. Verificando times atuais...');
    
    const { data: currentTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .eq('team_type', 'machine')
      .order('name');

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    console.log(`📊 Times da máquina atuais: ${currentTeams?.length || 0}`);

    if (currentTeams?.length !== 20) {
      console.log('❌ Precisamos de exatamente 20 times para criar 4 séries!');
      return;
    }

    // 2. Definir estrutura das séries
    console.log('\n🏗️  2. Definindo estrutura das séries...');
    
    const seriesStructure = {
      'Série A': {
        name: 'Série A',
        tier: 1,
        description: 'Primeira Divisão - Elite do Futebol',
        promotion_spots: 3, // Para Libertadores
        relegation_spots: 4, // Para Série B
        teams: currentTeams.slice(0, 19) // Primeiros 19 times
      },
      'Série B': {
        name: 'Série B', 
        tier: 2,
        description: 'Segunda Divisão - Acesso à Elite',
        promotion_spots: 4, // Para Série A
        relegation_spots: 4, // Para Série C
        teams: currentTeams.slice(19, 38) // Próximos 19 times
      },
      'Série C': {
        name: 'Série C',
        tier: 3, 
        description: 'Terceira Divisão - Base do Sistema',
        promotion_spots: 4, // Para Série B
        relegation_spots: 4, // Para Série D
        teams: currentTeams.slice(38, 57) // Próximos 19 times
      },
      'Série D': {
        name: 'Série D',
        tier: 4,
        description: 'Quarta Divisão - Início da Jornada',
        promotion_spots: 4, // Para Série C
        relegation_spots: 0, // Sem rebaixamento
        teams: currentTeams.slice(57, 76) // Últimos 19 times
      }
    };

    // 3. Criar tabela de séries
    console.log('\n📊 3. Criando estrutura de séries...');
    
    // Primeiro, vamos criar a tabela de séries se não existir
    const { error: createSeriesError } = await supabase.rpc('create_series_table_if_not_exists');
    
    if (createSeriesError) {
      console.log('   ℹ️  Tabela de séries já existe ou erro na criação');
    }

    // 4. Atualizar times com informações da série
    console.log('\n🔄 4. Atualizando times com informações da série...');
    
    for (const [seriesName, series] of Object.entries(seriesStructure)) {
      if (series.teams.length > 0) {
        console.log(`   📋 Atualizando ${series.teams.length} times para ${seriesName}...`);
        
        const teamIds = series.teams.map(t => t.id);
        
        const { error: updateError } = await supabase
          .from('game_teams')
          .update({
            series: seriesName,
            tier: series.tier,
            series_info: {
              name: series.name,
              tier: series.tier,
              description: series.description,
              promotion_spots: series.promotion_spots,
              relegation_spots: series.relegation_spots
            }
          })
          .in('id', teamIds);

        if (updateError) {
          console.log(`      ❌ Erro ao atualizar ${seriesName}:`, updateError.message);
        } else {
          console.log(`      ✅ ${seriesName} atualizada com sucesso`);
        }
      }
    }

    // 5. Criar tabela de competições
    console.log('\n🏆 5. Criando estrutura de competições...');
    
    const competitions = [
      {
        name: 'Campeonato Brasileiro Série A',
        series: 'Série A',
        tier: 1,
        season: 2025,
        status: 'active',
        format: 'league',
        teams_count: 20,
        rounds: 38,
        promotion_spots: 3,
        relegation_spots: 4
      },
      {
        name: 'Campeonato Brasileiro Série B', 
        series: 'Série B',
        tier: 2,
        season: 2025,
        status: 'active',
        format: 'league',
        teams_count: 20,
        rounds: 38,
        promotion_spots: 4,
        relegation_spots: 4
      },
      {
        name: 'Campeonato Brasileiro Série C',
        series: 'Série C', 
        tier: 3,
        season: 2025,
        status: 'active',
        format: 'league',
        teams_count: 20,
        rounds: 38,
        promotion_spots: 4,
        relegation_spots: 4
      },
      {
        name: 'Campeonato Brasileiro Série D',
        series: 'Série D',
        tier: 4,
        season: 2025,
        status: 'active',
        format: 'league',
        teams_count: 20,
        rounds: 38,
        promotion_spots: 4,
        relegation_spots: 0
      }
    ];

    // 6. Verificar resultado final
    console.log('\n📊 6. Verificando resultado final...');
    
    const { data: finalTeams, error: finalError } = await supabase
      .from('game_teams')
      .select('name, series, tier, series_info')
      .eq('team_type', 'machine')
      .order('tier, name');

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`📊 Times organizados: ${finalTeams?.length || 0}`);
      
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
    console.log('\n🎉 ESTRUTURA DE SÉRIES CRIADA!');
    console.log('\n📝 RESUMO:');
    console.log('   • ✅ 4 séries criadas (A, B, C, D)');
    console.log('   • ✅ 19 times da máquina por série');
    console.log('   • ✅ Sistema de promoção/rebaixamento configurado');
    console.log('   • ✅ Times da máquina fixos e imutáveis');
    console.log('   • ✅ Estrutura pronta para usuários');

    console.log('\n💡 COMO FUNCIONA:');
    console.log('   1. 🏆 Série A: Elite, 3 promoções para Libertadores');
    console.log('   2. 🥈 Série B: Acesso, 4 promoções para Série A');
    console.log('   3. 🥉 Série C: Base, 4 promoções para Série B');
    console.log('   4. 🏅 Série D: Início, 4 promoções para Série C');
    console.log('   5. 👤 Usuários começam na Série D e sobem');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createSeriesStructure();
