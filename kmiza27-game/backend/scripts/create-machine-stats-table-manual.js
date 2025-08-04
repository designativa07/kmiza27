const { getSupabaseClient } = require('../config/supabase-connection');

async function createMachineStatsTableManual() {
  console.log('🎮 CRIAÇÃO DA TABELA DE ESTATÍSTICAS DOS TIMES DA MÁQUINA');
  console.log('='.repeat(70));
  
  const supabase = getSupabaseClient('vps');
  
  try {
    // 1. Verificar se a tabela já existe tentando fazer uma consulta
    console.log('🔍 Verificando se a tabela game_machine_team_stats já existe...');
    
    const { data: testTable, error: tableError } = await supabase
      .from('game_machine_team_stats')
      .select('id')
      .limit(1);
    
    if (!tableError) {
      console.log('✅ Tabela game_machine_team_stats já existe!');
      
      // Verificar quantos registros existem
      const { count, error: countError } = await supabase
        .from('game_machine_team_stats')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`📊 Tabela tem ${count} registros de estatísticas`);
      }
      
      return await populateExistingTable(supabase);
    }
    
    // 2. Se a tabela não existe, mostrar o SQL para criar
    console.log('❌ Tabela game_machine_team_stats NÃO existe');
    console.log('');
    console.log('🔧 EXECUTE ESTE SQL NO SUPABASE STUDIO:');
    console.log('=' .repeat(50));
    console.log(`
-- Criar tabela de estatísticas dos times da máquina
CREATE TABLE IF NOT EXISTS game_machine_team_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES game_machine_teams(id) ON DELETE CASCADE,
  season_year INTEGER NOT NULL DEFAULT 2025,
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 4),
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, season_year, tier)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_machine_stats_season ON game_machine_team_stats(season_year, tier);
CREATE INDEX IF NOT EXISTS idx_machine_stats_team ON game_machine_team_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_machine_stats_points ON game_machine_team_stats(tier, season_year, points DESC);
`);
    console.log('=' .repeat(50));
    console.log('');
    console.log('📋 DEPOIS DE EXECUTAR O SQL ACIMA, execute novamente este script');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

async function populateExistingTable(supabase) {
  try {
    console.log('📋 Populando tabela existente com registros zerados...');
    
    // Buscar todos os times da máquina
    const { data: machineTeams, error: teamsError } = await supabase
      .from('game_machine_teams')
      .select('id, name, tier')
      .eq('is_active', true);
    
    if (teamsError) {
      throw new Error(`Erro ao buscar times da máquina: ${teamsError.message}`);
    }
    
    console.log(`🔍 Encontrados ${machineTeams.length} times da máquina ativos`);
    
    let inserted = 0;
    let existing = 0;
    
    // Inserir registro para cada time da máquina
    for (const team of machineTeams) {
      const { data, error: insertError } = await supabase
        .from('game_machine_team_stats')
        .insert({
          team_id: team.id,
          season_year: 2025,
          tier: team.tier,
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
          // Registro já existe (violação de unique constraint)
          existing++;
          console.log(`   ⚠️ ${team.name} - registro já existe`);
        } else {
          console.error(`   ❌ ${team.name} - erro:`, insertError.message);
        }
      } else {
        inserted++;
        console.log(`   ✅ ${team.name} - registro criado`);
      }
    }
    
    console.log('');
    console.log('📊 RESULTADO:');
    console.log(`   - Registros inseridos: ${inserted}`);
    console.log(`   - Registros já existentes: ${existing}`);
    console.log(`   - Total de times: ${machineTeams.length}`);
    
    if (inserted > 0) {
      console.log('');
      console.log('🎉 TABELA POPULADA COM SUCESSO!');
      console.log('💡 Agora os times da máquina devem começar a pontuar após as próximas simulações');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao popular tabela:', error);
    return false;
  }
}

// Executar script
if (require.main === module) {
  createMachineStatsTableManual();
}

module.exports = { createMachineStatsTableManual };