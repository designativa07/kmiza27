const { getSupabaseServiceClient } = require('../config/supabase-connection');
const { handleUserEnrollment } = require('./auto-enroll-when-user-joins');

console.log('🔧 INTEGRAÇÃO COM BACKEND NESTJS');
console.log('=' .repeat(50));

async function integrateWithBackend() {
  try {
    console.log('\n📋 1. Verificando estrutura do backend...');
    
    // Verificar se o arquivo do service existe
    const fs = require('fs');
    const path = require('path');
    
    const servicePath = path.join(__dirname, '../src/modules/competitions/competitions.service.ts');
    
    if (!fs.existsSync(servicePath)) {
      console.log('❌ Arquivo competitions.service.ts não encontrado');
      return;
    }
    
    console.log('✅ Arquivo competitions.service.ts encontrado');
    
    // Ler o arquivo atual
    const currentContent = fs.readFileSync(servicePath, 'utf8');
    
    console.log('\n📝 2. Gerando código de integração...');
    
    // Gerar o código de integração
    const integrationCode = generateIntegrationCode();
    
    console.log('\n📋 3. Verificando se já existe integração...');
    
    if (currentContent.includes('handleUserEnrollment')) {
      console.log('⚠️  Integração já existe no código');
      console.log('💡 Para atualizar, edite manualmente o arquivo competitions.service.ts');
    } else {
      console.log('✅ Integração não existe, pronta para implementar');
    }
    
    console.log('\n📋 4. Código de integração gerado:');
    console.log('=' .repeat(50));
    console.log(integrationCode);
    console.log('=' .repeat(50));
    
    console.log('\n📋 5. Instruções de implementação:');
    console.log('1. Abra o arquivo: src/modules/competitions/competitions.service.ts');
    console.log('2. Adicione o import no topo do arquivo:');
    console.log('   import { handleUserEnrollment } from "../../../scripts/auto-enroll-when-user-joins";');
    console.log('3. Substitua o método registerTeamInCompetition pelo código gerado acima');
    console.log('4. Reinicie o servidor NestJS');
    
    console.log('\n✅ Integração preparada!');
    
  } catch (error) {
    console.error('❌ Erro na integração:', error);
  }
}

function generateIntegrationCode() {
  return `  async registerTeamInCompetition(teamId: string, competitionId: string) {
    try {
      // Verificar se o time já está inscrito
      const { data: existingRegistration, error: checkError } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('team_id', teamId)
        .single();

      if (existingRegistration) {
        throw new Error('Time já está inscrito nesta competição');
      }

      // Verificar se a competição está cheia
      const { data: competition, error: compError } = await supabase
        .from('game_competitions')
        .select('max_teams, current_teams, min_teams, tier')
        .eq('id', competitionId)
        .single();

      if (compError) throw new Error(\`Error fetching competition: \${compError.message}\`);

      if (competition.current_teams >= competition.max_teams) {
        throw new Error('Competição está cheia');
      }

      // Inserir inscrição do usuário
      const { data: registration, error: insertError } = await supabase
        .from('game_competition_teams')
        .insert({
          competition_id: competitionId,
          team_id: teamId
        })
        .select()
        .single();

      if (insertError) throw new Error(\`Error registering team: \${insertError.message}\`);

      // Criar entrada na classificação para o usuário
      await supabase
        .from('game_standings')
        .insert({
          competition_id: competitionId,
          team_id: teamId,
          season_year: 2024
        });

      // ATIVAÇÃO DO SISTEMA AUTOMÁTICO
      this.logger.log(\`🎯 Ativando sistema automático para competição \${competitionId}\`);
      
      try {
        // Importar e chamar o sistema automático
        const { handleUserEnrollment } = require('../../../scripts/auto-enroll-when-user-joins');
        const result = await handleUserEnrollment(competitionId, teamId);
        
        if (result.success) {
          this.logger.log('✅ Sistema automático ativado com sucesso!');
          this.logger.log(\`📊 Resultado: \${result.message}\`);
        } else {
          this.logger.warn('⚠️ Sistema automático falhou, mas inscrição foi realizada');
          this.logger.warn(\`❌ Erro: \${result.message}\`);
        }
      } catch (autoError) {
        this.logger.error('❌ Erro no sistema automático:', autoError);
        this.logger.log('⚠️ Inscrição foi realizada, mas sistema automático falhou');
      }

      this.logger.log(\`Team \${teamId} registered in competition \${competitionId}\`);
      return registration;
    } catch (error) {
      this.logger.error('Error registering team in competition:', error);
      throw error;
    }
  }`;
}

async function testIntegration() {
  console.log('\n🧪 TESTE DE INTEGRAÇÃO');
  console.log('=' .repeat(30));
  
  try {
    // Simular uma inscrição
    const competitionId = 'test-competition';
    const teamId = 'test-team';
    
    console.log('📋 Testando handleUserEnrollment...');
    const result = await handleUserEnrollment(competitionId, teamId);
    
    console.log('📊 Resultado do teste:', result);
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

async function checkSystemStatus() {
  console.log('\n📊 STATUS DO SISTEMA');
  console.log('=' .repeat(30));
  
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    // Verificar competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams, min_teams');
    
    if (compError) {
      console.log('❌ Erro ao buscar competições:', compError.message);
      return;
    }
    
    console.log('📋 Competições encontradas:', competitions.length);
    competitions.forEach(comp => {
      console.log(`  - ${comp.name} (Série ${comp.tier}): ${comp.current_teams}/${comp.max_teams} times`);
    });
    
    // Verificar times da máquina
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name, team_type, machine_tier')
      .eq('team_type', 'machine');
    
    if (teamsError) {
      console.log('❌ Erro ao buscar times da máquina:', teamsError.message);
      return;
    }
    
    console.log('🤖 Times da máquina encontrados:', machineTeams.length);
    
    // Verificar jogadores
    const { data: players, error: playersError } = await supabase
      .from('youth_players')
      .select('id, team_id');
    
    if (playersError) {
      console.log('❌ Erro ao buscar jogadores:', playersError.message);
      return;
    }
    
    console.log('👥 Jogadores encontrados:', players.length);
    
    console.log('\n✅ Sistema verificado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar sistema:', error);
  }
}

// Executar integração
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    testIntegration();
  } else if (args.includes('--status')) {
    checkSystemStatus();
  } else {
    integrateWithBackend();
  }
}

module.exports = {
  integrateWithBackend,
  generateIntegrationCode,
  testIntegration,
  checkSystemStatus
}; 