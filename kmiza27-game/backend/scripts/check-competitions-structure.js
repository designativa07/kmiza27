const { getSupabaseClient } = require('../config/supabase-connection');

async function checkCompetitionsStructure() {
  try {
    console.log('🔍 Verificando estrutura das competições...');
    
    const supabase = getSupabaseClient('vps');
    
    // Verificar tabelas de competições
    const tables = [
      'game_competitions',
      'game_competition_teams', 
      'game_standings',
      'game_rounds',
      'game_matches'
    ];
    
    console.log('\n📋 Status das tabelas:');
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: Acessível`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: Não encontrada`);
      }
    }
    
    // Verificar competições existentes
    console.log('\n🏆 Competições existentes:');
    try {
      const { data: competitions, error } = await supabase
        .from('game_competitions')
        .select('*')
        .order('tier', { ascending: true });
      
      if (error) {
        console.log(`  ❌ Erro ao buscar competições: ${error.message}`);
      } else if (competitions && competitions.length > 0) {
        competitions.forEach(comp => {
          console.log(`  🏆 ${comp.name} (Série ${comp.tier}) - ${comp.current_teams}/${comp.max_teams} times`);
        });
      } else {
        console.log('  ⚠️ Nenhuma competição encontrada');
      }
    } catch (err) {
      console.log(`  ❌ Erro: ${err.message}`);
    }
    
    // Verificar times da máquina
    console.log('\n🤖 Times da máquina:');
    try {
      const { data: machineTeams, error } = await supabase
        .from('game_teams')
        .select('id, name, tier')
        .eq('is_machine_team', true)
        .order('tier', { ascending: true });
      
      if (error) {
        console.log(`  ❌ Erro ao buscar times da máquina: ${error.message}`);
      } else if (machineTeams && machineTeams.length > 0) {
        const tiers = {};
        machineTeams.forEach(team => {
          if (!tiers[team.tier]) tiers[team.tier] = [];
          tiers[team.tier].push(team.name);
        });
        
        Object.keys(tiers).forEach(tier => {
          console.log(`  📊 Série ${tier}: ${tiers[tier].length} times`);
          tiers[tier].forEach(name => console.log(`    - ${name}`));
        });
      } else {
        console.log('  ⚠️ Nenhum time da máquina encontrado');
      }
    } catch (err) {
      console.log(`  ❌ Erro: ${err.message}`);
    }
    
    // Verificar classificações
    console.log('\n📊 Classificações:');
    try {
      const { data: standings, error } = await supabase
        .from('game_standings')
        .select('competition_id, team_id, position, points')
        .limit(10);
      
      if (error) {
        console.log(`  ❌ Erro ao buscar classificações: ${error.message}`);
      } else if (standings && standings.length > 0) {
        console.log(`  ✅ ${standings.length} entradas de classificação encontradas`);
      } else {
        console.log('  ⚠️ Nenhuma classificação encontrada');
      }
    } catch (err) {
      console.log(`  ❌ Erro: ${err.message}`);
    }
    
    console.log('\n🎯 RECOMENDAÇÕES PARA FASE 2:');
    console.log('1. ✅ Sistema de competições básico implementado');
    console.log('2. 🔄 Implementar sistema de rodadas automáticas');
    console.log('3. 🔄 Implementar promoção/rebaixamento automático');
    console.log('4. 🔄 Melhorar sistema de classificações');
    console.log('5. 🔄 Implementar sistema de partidas PvP');
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
  }
}

checkCompetitionsStructure(); 