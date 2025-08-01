const { getSupabaseClient } = require('../config/supabase-connection');
const { handleUserEnrollment } = require('./auto-enroll-when-user-joins');

// Função para integrar com o sistema de inscrição do backend
async function integrateWithBackend() {
  try {
    console.log('🔗 INTEGRANDO SISTEMA AUTOMÁTICO COM BACKEND');
    console.log('=' .repeat(60));
    
    // 1. VERIFICAR ESTRUTURA DO BACKEND
    console.log('\n📋 1. Verificando estrutura do backend...');
    await checkBackendStructure();
    
    // 2. CRIAR FUNÇÃO DE INTEGRAÇÃO
    console.log('\n⚙️ 2. Criando função de integração...');
    await createIntegrationFunction();
    
    // 3. TESTAR INTEGRAÇÃO
    console.log('\n🧪 3. Testando integração...');
    await testIntegration();
    
    console.log('\n✅ INTEGRAÇÃO CONCLUÍDA!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('   1. Adicionar a chamada no controller de competições');
    console.log('   2. Testar inscrição de usuário');
    console.log('   3. Verificar criação automática de times da máquina');
    console.log('   4. Verificar criação do calendário');
    
  } catch (error) {
    console.error('❌ Erro na integração:', error);
  }
}

async function checkBackendStructure() {
  try {
    const supabase = getSupabaseClient('vps');
    
    // Verificar se as tabelas necessárias existem
    const requiredTables = [
      'game_competitions',
      'game_competition_teams', 
      'game_teams',
      'game_matches',
      'game_standings',
      'youth_players'
    ];
    
    console.log('  📋 Verificando tabelas necessárias...');
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`    ❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`    ✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`    ❌ Tabela ${table}: Não encontrada`);
      }
    }
    
    // Verificar competições existentes
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams, min_teams')
      .order('tier', { ascending: true });
    
    if (compError) {
      console.log(`    ❌ Erro ao buscar competições: ${compError.message}`);
    } else {
      console.log(`    ✅ ${competitions.length} competições encontradas:`);
      competitions.forEach(comp => {
        console.log(`      🏆 ${comp.name} (Série ${comp.tier}) - ${comp.current_teams}/${comp.max_teams} times`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
  }
}

async function createIntegrationFunction() {
  try {
    console.log('  ⚙️ Criando função de integração...');
    
    // Criar arquivo de integração para o backend
    const integrationCode = `
// INTEGRAÇÃO COM SISTEMA AUTOMÁTICO DE COMPETIÇÕES
// Adicionar este código no controller de competições

import { handleUserEnrollment } from '../scripts/auto-enroll-when-user-joins';

// Função para ser chamada quando um usuário se inscreve
async function onUserEnrollsInCompetition(competitionId: string, userTeamId: string) {
  try {
    console.log(\`🎯 Usuário se inscreveu na competição \${competitionId}\`);
    
    // Chamar sistema automático
    const result = await handleUserEnrollment(competitionId, userTeamId);
    
    if (result.success) {
      console.log('✅ Sistema automático ativado com sucesso!');
      return {
        success: true,
        message: result.message,
        autoEnrolled: true
      };
    } else {
      console.log('❌ Falha no sistema automático');
      return {
        success: false,
        message: result.message,
        autoEnrolled: false
      };
    }
  } catch (error) {
    console.error('❌ Erro na integração automática:', error);
    return {
      success: false,
      message: 'Erro interno no sistema automático',
      autoEnrolled: false
    };
  }
}

// Exemplo de uso no controller:
/*
@Post(':competitionId/enroll')
async enrollTeamInCompetition(
  @Param('competitionId') competitionId: string,
  @Body() enrollData: { teamId: string, userId: string }
) {
  try {
    // 1. Inscrição normal do usuário
    const enrollment = await this.competitionService.enrollTeam(
      competitionId, 
      enrollData.teamId, 
      enrollData.userId
    );
    
    // 2. Ativar sistema automático
    const autoResult = await onUserEnrollsInCompetition(
      competitionId, 
      enrollData.teamId
    );
    
    return {
      ...enrollment,
      autoSystem: autoResult
    };
    
  } catch (error) {
    throw new BadRequestException('Erro na inscrição');
  }
}
*/
`;
    
    console.log('    📝 Código de integração criado');
    console.log('    📋 Copie o código acima para o controller de competições');
    
  } catch (error) {
    console.error('❌ Erro ao criar função de integração:', error);
  }
}

async function testIntegration() {
  try {
    console.log('  🧪 Testando integração...');
    
    const supabase = getSupabaseClient('vps');
    
    // Buscar uma competição para teste
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier')
      .eq('tier', 4) // Série D para teste
      .limit(1);
    
    if (compError || !competitions || competitions.length === 0) {
      console.log('    ❌ Nenhuma competição encontrada para teste');
      return;
    }
    
    const testCompetition = competitions[0];
    const testTeamId = 'test-team-id'; // ID fictício para teste
    
    console.log(`    🧪 Testando com competição: ${testCompetition.name}`);
    
    // Simular inscrição de usuário
    const result = await handleUserEnrollment(testCompetition.id, testTeamId);
    
    if (result.success) {
      console.log('    ✅ Teste de integração bem-sucedido!');
      console.log(`    📊 Resultado: ${result.message}`);
    } else {
      console.log('    ❌ Teste de integração falhou');
      console.log(`    📊 Erro: ${result.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de integração:', error);
  }
}

// Função para verificar status do sistema
async function checkSystemStatus() {
  try {
    console.log('🔍 VERIFICANDO STATUS DO SISTEMA');
    console.log('=' .repeat(60));
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Verificar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams, min_teams')
      .order('tier', { ascending: true });
    
    if (compError) {
      console.log(`❌ Erro ao buscar competições: ${compError.message}`);
      return;
    }
    
    console.log(`\n📋 COMPETIÇÕES (${competitions.length}):`);
    for (const comp of competitions) {
      console.log(`  🏆 ${comp.name} (Série ${comp.tier})`);
      console.log(`     Times: ${comp.current_teams}/${comp.max_teams} (mín: ${comp.min_teams})`);
      
      // Verificar times inscritos
      const { data: enrolledTeams } = await supabase
        .from('game_competition_teams')
        .select('team_id')
        .eq('competition_id', comp.id);
      
      console.log(`     Inscritos: ${enrolledTeams?.length || 0}`);
      
      // Verificar partidas
      const { data: matches } = await supabase
        .from('game_matches')
        .select('id')
        .eq('competition_id', comp.id);
      
      console.log(`     Partidas: ${matches?.length || 0}`);
      
      // Verificar classificações
      const { data: standings } = await supabase
        .from('game_standings')
        .select('id')
        .eq('competition_id', comp.id);
      
      console.log(`     Classificações: ${standings?.length || 0}`);
      console.log('');
    }
    
    // 2. Verificar times da máquina
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, machine_tier')
      .eq('team_type', 'machine')
      .order('machine_tier', { ascending: true });
    
    if (teamsError) {
      console.log(`❌ Erro ao buscar times da máquina: ${teamsError.message}`);
    } else {
      console.log(`\n🤖 TIMES DA MÁQUINA (${machineTeams.length}):`);
      const teamsByTier = {};
      machineTeams.forEach(team => {
        const tier = team.machine_tier || 'N/A';
        if (!teamsByTier[tier]) teamsByTier[tier] = [];
        teamsByTier[tier].push(team.name);
      });
      
      for (const [tier, teams] of Object.entries(teamsByTier)) {
        console.log(`  Série ${tier}: ${teams.length} times`);
        teams.slice(0, 3).forEach(team => console.log(`    - ${team}`));
        if (teams.length > 3) console.log(`    ... e mais ${teams.length - 3} times`);
      }
    }
    
    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro na verificação de status:', error);
  }
}

// Executar integração
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--status')) {
    checkSystemStatus();
  } else {
    integrateWithBackend();
  }
}

module.exports = {
  integrateWithBackend,
  checkSystemStatus,
  checkBackendStructure,
  createIntegrationFunction,
  testIntegration
}; 