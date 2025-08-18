const { getSupabaseServiceClient } = require('../config/supabase-connection.js');

async function create76MachineTeamsSimple() {
  console.log('🤖 CRIANDO 76 TIMES DA MÁQUINA - VERSÃO SIMPLIFICADA');
  console.log('======================================================\n');

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
    
    const allTeamNames = [
      // Série A (19 times) - Elite
      'Flamengo', 'Palmeiras', 'Santos', 'Corinthians', 'São Paulo',
      'Grêmio', 'Internacional', 'Atlético Mineiro', 'Cruzeiro', 'Vasco',
      'Botafogo', 'Fluminense', 'Athletico Paranaense', 'Coritiba', 'Paraná',
      'Goiás', 'Atlético Goianiense', 'Vila Nova', 'Brasiliense',
      
      // Série B (19 times) - Acesso
      'Ceará', 'Fortaleza', 'Sport', 'Náutico', 'Santa Cruz',
      'Vitória', 'Bahia', 'Vitória da Conquista', 'Juazeirense', 'Jacuipense',
      'Confiança', 'Sergipe', 'Maranhão', 'Sampaio Corrêa', 'Imperatriz',
      'Tocantinópolis', 'Gurupi', 'Palmas', 'Araguaína',
      
      // Série C (19 times) - Base
      'Remo', 'Paysandu', 'Tuna Luso', 'Castanhal', 'Bragantino',
      'Ituano', 'Ponte Preta', 'Guarani', 'Oeste', 'Mirassol',
      'Votuporanga', 'São Bento', 'Rio Branco', 'XV de Piracicaba',
      'Comercial', 'Noroeste', 'Penapolense', 'Ferroviária', 'Linense',
      
      // Série D (19 times) - Início
      'Real Brasília', 'Gama', 'Ceilândia', 'Sobradinho', 'Luziânia',
      'Formosa', 'Anápolis', 'Cristalina', 'Planaltina', 'Valparaíso',
      'Águas Lindas', 'Novo Gama', 'Santo Antônio do Descoberto', 'Alexânia',
      'Corumbá de Goiás', 'Pirenópolis', 'Goianésia', 'Itaberaí', 'Inhumas'
    ];

    // 3. Criar times faltantes
    console.log('\n⚽ 3. Criando times faltantes...');
    
    let totalCreated = 0;
    const allTeamsToCreate = [];

    allTeamNames.forEach((teamName, index) => {
      // Verificar se o time já existe
      const existingTeam = currentTeams?.find(t => t.name === teamName);
      
      if (!existingTeam) {
        // Determinar série baseado no índice
        let tier, budget, reputation, fan_base, stadium_capacity;
        
        if (index < 19) { // Série A
          tier = 1;
          budget = 5000000;
          reputation = 80;
          fan_base = 50000;
          stadium_capacity = 60000;
        } else if (index < 38) { // Série B
          tier = 2;
          budget = 2000000;
          reputation = 65;
          fan_base = 25000;
          stadium_capacity = 40000;
        } else if (index < 57) { // Série C
          tier = 3;
          budget = 1000000;
          reputation = 50;
          fan_base = 15000;
          stadium_capacity = 25000;
        } else { // Série D
          tier = 4;
          budget = 500000;
          reputation = 35;
          fan_base = 8000;
          stadium_capacity = 15000;
        }

        allTeamsToCreate.push({
          id: require('crypto').randomUUID(),
          name: teamName,
          slug: teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          short_name: teamName.split(' ').slice(-1)[0],
          team_type: 'machine',
          budget: budget,
          reputation: reputation,
          fan_base: fan_base,
          colors: { primary: '#FF0000', secondary: '#FFFFFF' },
          stadium_name: `Estádio ${teamName}`,
          stadium_capacity: stadium_capacity
        });
      }
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
      .select('name, team_type, budget, reputation')
      .eq('team_type', 'machine')
      .order('budget DESC, name');

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`📊 Total de times da máquina: ${finalTeams?.length || 0}`);
      
      // Agrupar por orçamento (proxy para série)
      const budgetGroups = {
        'Elite (5M+)': finalTeams?.filter(t => t.budget >= 5000000) || [],
        'Acesso (2M+)': finalTeams?.filter(t => t.budget >= 2000000 && t.budget < 5000000) || [],
        'Base (1M+)': finalTeams?.filter(t => t.budget >= 1000000 && t.budget < 2000000) || [],
        'Início (500K+)': finalTeams?.filter(t => t.budget >= 500000 && t.budget < 1000000) || []
      };

      Object.entries(budgetGroups).forEach(([group, teams]) => {
        if (teams.length > 0) {
          console.log(`\n🏆 ${group} (${teams.length} times):`);
          teams.forEach(team => {
            console.log(`   • ${team.name} (Orçamento: ${team.budget.toLocaleString()})`);
          });
        }
      });
    }

    // 5. Resumo final
    console.log('\n🎉 CRIAÇÃO DE TIMES CONCLUÍDA!');
    console.log('\n📝 RESUMO:');
    console.log(`   • ✅ ${totalCreated} novos times criados`);
    console.log(`   • ✅ Total: ${finalTeams?.length || 0} times da máquina`);
    console.log(`   • ✅ 4 níveis organizados por orçamento`);
    console.log(`   • ✅ Sistema pronto para campeonatos`);

    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('   1. Executar create-machine-teams-starters.js para criar jogadores');
    console.log('   2. Configurar sistema de promoção/rebaixamento');
    console.log('   3. Testar simulação de partidas');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

create76MachineTeamsSimple();
