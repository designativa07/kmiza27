const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function create76MachineTeams() {
  console.log('🤖 CRIANDO 76 TIMES DA MÁQUINA - 19 POR SÉRIE');
  console.log('================================================\n');

  const supabase = getSupabaseServiceClient('vps');

  try {
    // 1. Verificar times atuais
    console.log('📋 1. Verificando times atuais...');
    
    const { data: currentTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type')
      .eq('team_type', 'machine');

    if (teamsError) {
      console.log('❌ Erro ao buscar times:', teamsError.message);
      return;
    }

    console.log(`📊 Times da máquina atuais: ${currentTeams?.length || 0}`);

    if (currentTeams?.length >= 76) {
      console.log('✅ Já temos 76 times! Não é necessário criar mais.');
      return;
    }

    // 2. Definir nomes dos times por série
    console.log('\n🏗️  2. Definindo nomes dos times por série...');
    
    const seriesTeams = {
      'Série A': [
        'Flamengo', 'Palmeiras', 'Santos', 'Corinthians', 'São Paulo',
        'Grêmio', 'Internacional', 'Atlético Mineiro', 'Cruzeiro', 'Vasco',
        'Botafogo', 'Fluminense', 'Athletico Paranaense', 'Coritiba', 'Paraná',
        'Goiás', 'Atlético Goianiense', 'Vila Nova', 'Brasiliense'
      ],
      'Série B': [
        'Ceará', 'Fortaleza', 'Sport', 'Náutico', 'Santa Cruz',
        'Vitória', 'Bahia', 'Vitória da Conquista', 'Juazeirense', 'Jacuipense',
        'Confiança', 'Sergipe', 'Maranhão', 'Sampaio Corrêa', 'Imperatriz',
        'Tocantinópolis', 'Gurupi', 'Palmas', 'Araguaína'
      ],
      'Série C': [
        'Remo', 'Paysandu', 'Tuna Luso', 'Castanhal', 'Bragantino',
        'Ituano', 'Ponte Preta', 'Guarani', 'Oeste', 'Bragantino',
        'Mirassol', 'Votuporanga', 'São Bento', 'Rio Branco', 'XV de Piracicaba',
        'Comercial', 'Noroeste', 'Penapolense', 'Ferroviária'
      ],
      'Série D': [
        'Real Brasília', 'Gama', 'Ceilândia', 'Sobradinho', 'Luziânia',
        'Formosa', 'Anápolis', 'Cristalina', 'Planaltina', 'Valparaíso',
        'Águas Lindas', 'Novo Gama', 'Santo Antônio do Descoberto', 'Alexânia',
        'Corumbá de Goiás', 'Pirenópolis', 'Goianésia', 'Itaberaí', 'Inhumas'
      ]
    };

    // 3. Criar times faltantes
    console.log('\n⚽ 3. Criando times faltantes...');
    
    let totalCreated = 0;
    const allTeamsToCreate = [];

    Object.entries(seriesTeams).forEach(([series, teamNames]) => {
      teamNames.forEach((teamName, index) => {
        // Verificar se o time já existe
        const existingTeam = currentTeams?.find(t => t.name === teamName);
        
        if (!existingTeam) {
          allTeamsToCreate.push({
            id: require('crypto').randomUUID(),
            name: teamName,
            slug: teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            short_name: teamName.split(' ').slice(-1)[0],
            team_type: 'machine',
            series: series,
            tier: series === 'Série A' ? 1 : series === 'Série B' ? 2 : series === 'Série C' ? 3 : 4,
            budget: series === 'Série A' ? 5000000 : series === 'Série B' ? 2000000 : series === 'Série C' ? 1000000 : 500000,
            reputation: series === 'Série A' ? 80 : series === 'Série B' ? 65 : series === 'Série C' ? 50 : 35,
            fan_base: series === 'Série A' ? 50000 : series === 'Série B' ? 25000 : series === 'Série C' ? 15000 : 8000,
            colors: { primary: '#FF0000', secondary: '#FFFFFF' },
            stadium_name: `Estádio ${teamName}`,
            stadium_capacity: series === 'Série A' ? 60000 : series === 'Série B' ? 40000 : series === 'Série C' ? 25000 : 15000
          });
        }
      });
    });

    console.log(`📊 Times a serem criados: ${allTeamsToCreate.length}`);

    if (allTeamsToCreate.length > 0) {
      // Criar em lotes para evitar problemas de performance
      const batchSize = 10;
      for (let i = 0; i < allTeamsToCreate.length; i += batchSize) {
        const batch = allTeamsToCreate.slice(i, i + batchSize);
        
        const { data: createdBatch, error: batchError } = await supabase
          .from('game_teams')
          .insert(batch)
          .select();

        if (batchError) {
          console.log(`   ❌ Erro ao criar lote ${Math.floor(i/batchSize) + 1}:`, batchError.message);
        } else {
          console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1} criado: ${createdBatch?.length || 0} times`);
          totalCreated += createdBatch?.length || 0;
        }
      }
    }

    // 4. Verificar resultado final
    console.log('\n📊 4. Verificando resultado final...');
    
    const { data: finalTeams, error: finalError } = await supabase
      .from('game_teams')
      .select('name, series, tier')
      .eq('team_type', 'machine')
      .order('tier, name');

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`📊 Total de times da máquina: ${finalTeams?.length || 0}`);
      
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

    // 5. Resumo final
    console.log('\n🎉 CRIAÇÃO DE TIMES CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ✅ ${totalCreated} novos times criados`);
    console.log(`   • ✅ Total: ${finalTeams?.length || 0} times da máquina`);
    console.log(`   • ✅ 4 séries organizadas (A, B, C, D)`);
    console.log(`   • ✅ Sistema pronto para campeonatos`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Executar create-machine-teams-starters.js para criar jogadores');
    console.log('   2. Configurar sistema de promoção/rebaixamento');
    console.log('   3. Testar simulação de partidas');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

create76MachineTeams();
