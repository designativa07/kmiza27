const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (mesma do projeto)
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function garantir20TimesPorSerie() {
  console.log('🎯 GARANTINDO 20 TIMES POR SÉRIE (19 MÁQUINAS + 1 USUÁRIO)');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar competições existentes
    console.log('📊 Verificando competições existentes...');
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams')
      .eq('status', 'active')
      .order('tier');

    if (compError) {
      console.error('❌ Erro ao buscar competições:', compError);
      return;
    }

    console.log(`✅ Encontradas ${competitions.length} competições ativas`);

    // 2. Para cada competição, garantir 20 times
    for (const competition of competitions) {
      console.log(`\n🏆 Processando ${competition.name} (Tier ${competition.tier})`);
      console.log(`   - Times atuais: ${competition.current_teams}`);
      console.log(`   - Capacidade máxima: ${competition.max_teams}`);

      // Atualizar capacidade para 20 times
      if (competition.max_teams !== 20) {
        console.log(`   🔧 Ajustando capacidade para 20 times...`);
        const { error: updateError } = await supabase
          .from('game_competitions')
          .update({ max_teams: 20 })
          .eq('id', competition.id);

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar ${competition.name}:`, updateError);
          continue;
        }
        console.log(`   ✅ Capacidade de ${competition.name} ajustada para 20 times`);
      }

      // 3. Verificar times inscritos
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select(`
          *,
          game_teams!inner(id, name, team_type, owner_id)
        `)
        .eq('competition_id', competition.id);

      if (teamsError) {
        console.error(`   ❌ Erro ao buscar times inscritos:`, teamsError);
        continue;
      }

      const userTeams = enrolledTeams.filter(team => team.game_teams.team_type === 'user_created');
      const machineTeams = enrolledTeams.filter(team => team.game_teams.team_type === 'machine');

      console.log(`   📊 Times inscritos: ${enrolledTeams.length}`);
      console.log(`   👤 Times de usuários: ${userTeams.length}`);
      console.log(`   🤖 Times da máquina: ${machineTeams.length}`);

      // 4. Calcular quantos times da máquina precisamos
      const targetMachineTeams = 19;
      const currentMachineTeams = machineTeams.length;
      const neededMachineTeams = targetMachineTeams - currentMachineTeams;

      if (neededMachineTeams > 0) {
        console.log(`   🤖 Criando ${neededMachineTeams} times da máquina...`);
        await criarTimesMaquina(competition.id, neededMachineTeams);
      } else if (neededMachineTeams < 0) {
        console.log(`   🗑️ Removendo ${Math.abs(neededMachineTeams)} times da máquina extras...`);
        await removerTimesMaquinaExtras(competition.id, Math.abs(neededMachineTeams));
      } else {
        console.log(`   ✅ Número correto de times da máquina (19)`);
      }

      // 5. Verificar se há times de usuário
      if (userTeams.length === 0) {
        console.log(`   ⚠️ Nenhum time de usuário encontrado em ${competition.name}`);
        console.log(`   💡 Quando um usuário criar um time, ele será inscrito automaticamente`);
      } else if (userTeams.length > 1) {
        console.log(`   ⚠️ Múltiplos times de usuário encontrados (${userTeams.length})`);
        console.log(`   💡 Idealmente deveria haver apenas 1 time de usuário por série`);
      } else {
        console.log(`   ✅ 1 time de usuário encontrado`);
      }

      // 6. Verificar total de times
      const { data: finalTeams, error: finalError } = await supabase
        .from('game_competition_teams')
        .select('*')
        .eq('competition_id', competition.id);

      if (finalError) {
        console.error(`   ❌ Erro ao verificar times finais:`, finalError);
      } else {
        console.log(`   🎯 Total final: ${finalTeams.length}/20 times`);
        
        // Atualizar contador na competição
        const { error: countError } = await supabase
          .from('game_competitions')
          .update({ current_teams: finalTeams.length })
          .eq('id', competition.id);

        if (countError) {
          console.error(`   ❌ Erro ao atualizar contador:`, countError);
        } else {
          console.log(`   ✅ Contador atualizado para ${finalTeams.length} times`);
        }
      }
    }

    console.log('\n🎉 PROCESSO CONCLUÍDO!');
    console.log('📋 RESUMO:');
    console.log('   - Todas as séries agora têm capacidade para 20 times');
    console.log('   - Cada série terá 19 times da máquina + 1 time de usuário');
    console.log('   - Total de 38 rodadas por temporada (19 × 2)');
    console.log('   - Quando um usuário criar um time, ele será inscrito na Série D');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function criarTimesMaquina(competitionId, quantidade) {
  try {
    console.log(`   🤖 Criando ${quantidade} times da máquina...`);

    // Lista de nomes de times brasileiros para usar
    const nomesTimes = [
      'Atlético Mineiro', 'Cruzeiro', 'América Mineiro', 'Tombense',
      'Athletico Paranaense', 'Coritiba', 'Londrina', 'Cascavel',
      'Bahia', 'Vitória', 'Juazeirense', 'Jacobinense',
      'Ceará', 'Fortaleza', 'Ferroviário', 'Icasa',
      'Sport', 'Náutico', 'Salgueiro', 'Central',
      'Grêmio', 'Internacional', 'Juventude', 'Caxias',
      'Flamengo', 'Vasco', 'Botafogo', 'Fluminense',
      'Palmeiras', 'Corinthians', 'São Paulo', 'Santos',
      'Goiás', 'Vila Nova', 'Aparecidense', 'Anápolis',
      'Paysandu', 'Remo', 'Tuna Luso', 'Independente',
      'Sampaio Corrêa', 'Maranhão', 'Imperatriz', 'Moto Club',
      'Vitória', 'Bahia de Feira', 'Juazeirense', 'Jacobina',
      'Criciúma', 'Avaí', 'Chapecoense', 'Brusque',
      'Ponte Preta', 'Guarani', 'Ituano', 'Mirassol',
      'Bragantino', 'Ituano', 'Novorizontino', 'Guaratinguetá',
      'Oeste', 'São Bento', 'Santo André', 'Portuguesa',
      'Boa', 'Tupi', 'Democrata', 'Ipatinga',
      'América de Natal', 'ABC', 'Globo', 'Potiguar',
      'Botafogo-PB', 'Treze', 'Campinense', 'Auto Esporte',
      'Santa Cruz', 'Náutico', 'Salgueiro', 'Central',
      'Confiança', 'Sergipe', 'Itabaiana', 'Falcon'
    ];

    // Filtrar nomes já usados
    const { data: existingTeams, error: existingError } = await supabase
      .from('game_teams')
      .select('name')
      .eq('team_type', 'machine');

    if (existingError) {
      console.error(`   ❌ Erro ao buscar times existentes:`, existingError);
      return;
    }

    const nomesUsados = existingTeams.map(team => team.name);
    const nomesDisponiveis = nomesTimes.filter(nome => !nomesUsados.includes(nome));

    if (nomesDisponiveis.length < quantidade) {
      console.error(`   ❌ Não há nomes suficientes disponíveis`);
      return;
    }

    // Criar times da máquina
    for (let i = 0; i < quantidade; i++) {
      const nomeTime = nomesDisponiveis[i];
      
      // Criar time
      const { data: newTeam, error: teamError } = await supabase
        .from('game_teams')
        .insert({
          name: nomeTime,
          slug: `machine-${Date.now()}-${i}`,
          team_type: 'machine',
          budget: 1000000,
          stadium_capacity: 15000,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (teamError) {
        console.error(`   ❌ Erro ao criar time ${nomeTime}:`, teamError);
        continue;
      }

      // Inserir na competição
      const { error: enrollError } = await supabase
        .from('game_competition_teams')
        .insert({
          competition_id: competitionId,
          team_id: newTeam.id,
          status: 'active'
        });

      if (enrollError) {
        console.error(`   ❌ Erro ao inscrever time ${nomeTime}:`, enrollError);
        continue;
      }

      // Criar entrada na classificação
      const { error: standingsError } = await supabase
        .from('game_standings')
        .insert({
          competition_id: competitionId,
          team_id: newTeam.id,
          season_year: new Date().getFullYear(),
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
        console.error(`   ❌ Erro ao criar classificação para ${nomeTime}:`, standingsError);
      }

      console.log(`   ✅ Time da máquina criado: ${nomeTime}`);
    }

  } catch (error) {
    console.error(`   ❌ Erro ao criar times da máquina:`, error);
  }
}

async function removerTimesMaquinaExtras(competitionId, quantidade) {
  try {
    console.log(`   🗑️ Removendo ${quantidade} times da máquina extras...`);

    // Buscar times da máquina na competição
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_competition_teams')
      .select(`
        *,
        game_teams!inner(id, name, team_type)
      `)
      .eq('competition_id', competitionId)
      .eq('game_teams.team_type', 'machine');

    if (teamsError) {
      console.error(`   ❌ Erro ao buscar times da máquina:`, teamsError);
      return;
    }

    // Remover os últimos times da máquina (mais recentes)
    const teamsToRemove = machineTeams.slice(-quantidade);

    for (const team of teamsToRemove) {
      // Remover da competição
      const { error: removeError } = await supabase
        .from('game_competition_teams')
        .delete()
        .eq('competition_id', competitionId)
        .eq('team_id', team.team_id);

      if (removeError) {
        console.error(`   ❌ Erro ao remover time ${team.game_teams.name}:`, removeError);
        continue;
      }

      // Remover da classificação
      const { error: standingsError } = await supabase
        .from('game_standings')
        .delete()
        .eq('competition_id', competitionId)
        .eq('team_id', team.team_id);

      if (standingsError) {
        console.error(`   ❌ Erro ao remover classificação de ${team.game_teams.name}:`, standingsError);
      }

      console.log(`   ✅ Time removido: ${team.game_teams.name}`);
    }

  } catch (error) {
    console.error(`   ❌ Erro ao remover times extras:`, error);
  }
}

// Executar o script
garantir20TimesPorSerie(); 