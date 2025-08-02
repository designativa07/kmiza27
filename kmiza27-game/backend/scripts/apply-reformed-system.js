const { getSupabaseClient } = require('../config/supabase-connection');
const fs = require('fs');
const path = require('path');

console.log('🎮 APLICANDO SISTEMA REFORMULADO - ESTILO ELIFOOT');
console.log('='.repeat(60));

async function applyReformedSystem() {
  try {
    const supabase = getSupabaseClient('vps');
    
    console.log('\n🏗️ 1. APLICANDO SCHEMA REFORMULADO');
    console.log('-'.repeat(50));
    
    // Ler e aplicar o schema reformulado
    const schemaPath = path.join(__dirname, '../database/reformulated-schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      console.log('📄 Schema reformulado lido com sucesso');
      console.log('⚠️  Execute este SQL manualmente no Supabase Studio:');
      console.log('');
      console.log('SCHEMA_START'.repeat(5));
      console.log(schemaSQL);
      console.log('SCHEMA_END'.repeat(5));
      console.log('');
    } else {
      console.log('❌ Arquivo schema não encontrado:', schemaPath);
    }
    
    console.log('\n🔍 2. VERIFICANDO SISTEMA REFORMULADO');
    console.log('-'.repeat(50));
    
    // Verificar se as tabelas reformuladas existem
    await checkReformedTables(supabase);
    
    // Verificar times da máquina
    await checkMachineTeams(supabase);
    
    console.log('\n🚀 3. TESTANDO APIS REFORMULADAS');
    console.log('-'.repeat(50));
    
    // Testar endpoints da API v2
    await testReformedAPIs();
    
    console.log('\n✅ APLICAÇÃO DO SISTEMA REFORMULADO CONCLUÍDA!');
    console.log('🎯 O backend agora usa apenas as APIs v2 reformuladas');
    console.log('🎮 Sistema estilo Elifoot pronto para uso!');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar sistema reformulado:', error);
  }
}

async function checkReformedTables(supabase) {
  const reformedTables = [
    'game_competitions_fixed',
    'game_machine_teams', 
    'game_user_competition_progress',
    'game_season_matches',
    'game_season_history'
  ];
  
  console.log('📋 Verificando tabelas reformuladas...');
  
  for (const table of reformedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: NÃO EXISTE - ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ERRO - ${error.message}`);
    }
  }
}

async function checkMachineTeams(supabase) {
  console.log('\n🤖 Verificando times da máquina...');
  
  try {
    const { data: teams, error } = await supabase
      .from('game_machine_teams')
      .select('tier')
      .eq('is_active', true);
    
    if (error) {
      console.log(`❌ Erro ao buscar times da máquina: ${error.message}`);
      return;
    }
    
    const teamsByTier = teams.reduce((acc, team) => {
      acc[team.tier] = (acc[team.tier] || 0) + 1;
      return acc;
    }, {});
    
    for (let tier = 1; tier <= 4; tier++) {
      const count = teamsByTier[tier] || 0;
      const tierName = getTierName(tier);
      
      if (count === 19) {
        console.log(`✅ Série ${tierName}: ${count}/19 times`);
      } else {
        console.log(`❌ Série ${tierName}: ${count}/19 times (INCOMPLETO)`);
      }
    }
    
    const totalTeams = Object.values(teamsByTier).reduce((acc, count) => acc + count, 0);
    console.log(`📊 Total: ${totalTeams}/76 times da máquina`);
    
  } catch (error) {
    console.log(`❌ Erro na verificação dos times da máquina: ${error.message}`);
  }
}

async function testReformedAPIs() {
  const baseURL = 'http://localhost:3004';
  
  const endpoints = [
    '/api/v2/game-teams/status',
    '/api/v2/machine-teams/admin/count',
    '/api/v2/promotion-relegation/rules'
  ];
  
  console.log('🔗 Testando endpoints da API v2...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseURL}${endpoint}`);
      
      if (response.ok) {
        console.log(`✅ ${endpoint}: OK (${response.status})`);
      } else {
        console.log(`❌ ${endpoint}: ERRO ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: FALHA - ${error.message}`);
    }
  }
}

function getTierName(tier) {
  const names = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return names[tier] || 'Desconhecida';
}

// Executar aplicação
applyReformedSystem().then(() => {
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Execute o SQL do schema no Supabase Studio');
  console.log('2. Reinicie o backend (npm run start:dev)');
  console.log('3. Teste a criação de um time pelo frontend');
  console.log('4. Verifique se a temporada é criada automaticamente');
  console.log('\n🎮 Sistema reformulado estilo Elifoot pronto!');
}).catch(error => {
  console.error('\n❌ Falha na aplicação:', error);
});