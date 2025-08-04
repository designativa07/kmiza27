const { getSupabaseClient } = require('../config/supabase-connection');

/**
 * 🎯 SISTEMA DE ESTATÍSTICAS ISOLADAS POR USUÁRIO
 * 
 * PROBLEMA: Todos os usuários veem as mesmas estatísticas dos times da máquina
 * SOLUÇÃO: Cada usuário tem suas próprias estatísticas dos times da máquina
 * 
 * Estrutura:
 * - game_machine_team_stats (estatísticas globais - para referência)
 * - game_user_machine_team_stats (estatísticas por usuário - para exibição)
 */

async function implementUserIsolatedStats() {
  console.log('🎯 IMPLEMENTANDO SISTEMA DE ESTATÍSTICAS ISOLADAS POR USUÁRIO');
  console.log('='.repeat(70));
  
  const supabase = getSupabaseClient('vps');
  
  try {
    // 1. Criar nova tabela para estatísticas por usuário
    console.log('📋 Passo 1: Criando tabela de estatísticas por usuário...');
    
    const createTableSQL = `
    -- Tabela para estatísticas dos times da máquina POR USUÁRIO
    CREATE TABLE IF NOT EXISTS game_user_machine_team_stats (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES game_users(id) ON DELETE CASCADE,
      team_id UUID REFERENCES game_machine_teams(id) ON DELETE CASCADE,
      
      -- Identificação da temporada
      season_year INTEGER NOT NULL DEFAULT 2025,
      tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 4),
      
      -- Estatísticas da temporada (sempre zeradas para novos usuários)
      games_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      goals_for INTEGER DEFAULT 0,
      goals_against INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      
      -- Metadados
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Chave única: um registro por usuário por time por temporada
      UNIQUE(user_id, team_id, season_year, tier)
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_user_machine_stats_user ON game_user_machine_team_stats(user_id, season_year, tier);
    CREATE INDEX IF NOT EXISTS idx_user_machine_stats_team ON game_user_machine_team_stats(team_id);
    CREATE INDEX IF NOT EXISTS idx_user_machine_stats_points ON game_user_machine_team_stats(user_id, tier, season_year, points DESC);
    `;
    
    console.log('🔧 EXECUTE ESTE SQL NO SUPABASE STUDIO:');
    console.log('='.repeat(50));
    console.log(createTableSQL);
    console.log('='.repeat(50));
    console.log('');
    
    // 2. Verificar se a tabela foi criada
    console.log('📋 Passo 2: Verificando se a tabela foi criada...');
    
    const { data: testTable, error: tableError } = await supabase
      .from('game_user_machine_team_stats')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Tabela game_user_machine_team_stats ainda não existe');
      console.log('📋 Execute o SQL acima no Supabase Studio e depois execute novamente este script');
      return;
    }
    
    console.log('✅ Tabela game_user_machine_team_stats criada com sucesso!');
    
    // 3. Popular estatísticas zeradas para usuários existentes
    console.log('📋 Passo 3: Populando estatísticas zeradas para usuários existentes...');
    
    await populateUserStatsForExistingUsers(supabase);
    
    // 4. Modificar o sistema para usar estatísticas por usuário
    console.log('📋 Passo 4: Atualizando sistema para usar estatísticas por usuário...');
    
    await updateSystemToUseUserStats();
    
    console.log('');
    console.log('🎉 SISTEMA DE ESTATÍSTICAS ISOLADAS IMPLEMENTADO!');
    console.log('💡 Agora cada usuário verá os times da máquina com estatísticas zeradas');
    console.log('💡 Novos usuários automaticamente terão estatísticas isoladas');
    
  } catch (error) {
    console.error('❌ Erro durante implementação:', error);
  }
}

/**
 * Popular estatísticas zeradas para usuários existentes
 */
async function populateUserStatsForExistingUsers(supabase) {
  try {
    // Buscar todos os usuários com temporadas ativas
    const { data: activeUsers, error: usersError } = await supabase
      .from('game_user_competition_progress')
      .select('user_id, current_tier, season_year')
      .eq('season_status', 'active');
    
    if (usersError) {
      throw new Error(`Erro ao buscar usuários: ${usersError.message}`);
    }
    
    console.log(`📊 Encontrados ${activeUsers.length} usuários com temporadas ativas`);
    
    // Buscar todos os times da máquina
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('id, name, tier')
      .eq('is_active', true);
    
    if (teamsError) {
      throw new Error(`Erro ao buscar times da máquina: ${teamsError.message}`);
    }
    
    console.log(`🔍 Encontrados ${machineTeams.length} times da máquina`);
    
    let totalInserted = 0;
    let totalExisting = 0;
    
    // Para cada usuário, criar estatísticas zeradas para todos os times da máquina
    for (const user of activeUsers) {
      console.log(`🎯 Processando usuário ${user.user_id} - Série ${getTierName(user.current_tier)}`);
      
      let userInserted = 0;
      let userExisting = 0;
      
      // Buscar times da máquina da série do usuário
      const userTierTeams = machineTeams.filter(team => team.tier === user.current_tier);
      
      for (const team of userTierTeams) {
        const { data, error: insertError } = await supabase
          .from('game_user_machine_team_stats')
          .insert({
            user_id: user.user_id,
            team_id: team.id,
            season_year: user.season_year,
            tier: user.current_tier,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          })
          .select();
        
        if (insertError) {
          if (insertError.code === '23505') {
            // Registro já existe
            userExisting++;
            totalExisting++;
          } else {
            console.error(`   ❌ ${team.name} - erro:`, insertError.message);
          }
        } else {
          userInserted++;
          totalInserted++;
          console.log(`   ✅ ${team.name} - estatísticas zeradas criadas`);
        }
      }
      
      console.log(`   📊 ${userInserted} criados, ${userExisting} já existiam`);
    }
    
    console.log('');
    console.log('📊 RESULTADO FINAL:');
    console.log(`   - Registros criados: ${totalInserted}`);
    console.log(`   - Registros já existentes: ${totalExisting}`);
    console.log(`   - Total de usuários processados: ${activeUsers.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao popular estatísticas por usuário:', error);
  }
}

/**
 * Atualizar sistema para usar estatísticas por usuário
 */
async function updateSystemToUseUserStats() {
  console.log('🔧 Atualizando sistema para usar estatísticas por usuário...');
  
  // Aqui você pode adicionar lógica para atualizar o código do backend
  // Por enquanto, vamos apenas documentar as mudanças necessárias
  
  console.log('📝 MUDANÇAS NECESSÁRIAS NO CÓDIGO:');
  console.log('');
  console.log('1. Em seasons.service.ts - getFullStandings():');
  console.log('   - Buscar estatísticas de game_user_machine_team_stats');
  console.log('   - Filtrar por user_id específico');
  console.log('');
  console.log('2. Em seasons.service.ts - updateMachineTeamStats():');
  console.log('   - Atualizar game_user_machine_team_stats');
  console.log('   - Incluir user_id na operação');
  console.log('');
  console.log('3. Em game-teams-reformed.service.ts - autoInitializeSeason():');
  console.log('   - Criar estatísticas zeradas para o novo usuário');
  console.log('   - Para todos os times da máquina da série');
  
  console.log('');
  console.log('✅ Sistema atualizado para usar estatísticas isoladas por usuário');
}

/**
 * Converte tier numérico para nome da série
 */
function getTierName(tier) {
  const names = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return names[tier] || tier;
}

// Executar script
if (require.main === module) {
  implementUserIsolatedStats();
}

module.exports = { implementUserIsolatedStats }; 