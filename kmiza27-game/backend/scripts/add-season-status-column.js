const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🔧 ADICIONANDO COLUNA SEASON_STATUS');
console.log('=' .repeat(35));

async function addSeasonStatusColumn() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Verificando estrutura atual...');
    
    const { data: competitions, error } = await supabase
      .from('game_competitions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar tabela:', error);
      return;
    }

    console.log('✅ Tabela game_competitions existe');
    console.log('📊 Colunas atuais:', Object.keys(competitions[0] || {}));

    // Verificar se a coluna season_status já existe
    if (competitions[0] && 'season_status' in competitions[0]) {
      console.log('✅ Coluna season_status já existe');
    } else {
      console.log('❌ Coluna season_status não existe');
    }

    console.log('\n📋 2. Tentando adicionar coluna via RPC...');
    
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS season_status VARCHAR(20) DEFAULT \'active\';'
      });

      if (rpcError) {
        console.log('⚠️  RPC não disponível');
      } else {
        console.log('✅ Coluna season_status adicionada via RPC');
      }
    } catch (error) {
      console.log('⚠️  RPC não disponível');
    }

    console.log('\n📋 3. Configurando valores padrão...');
    
    try {
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ season_status: 'active' })
        .is('season_status', null);

      if (updateError) {
        console.log('⚠️  Não foi possível atualizar valores padrão via script');
      } else {
        console.log('✅ Valores padrão configurados');
      }
    } catch (error) {
      console.log('⚠️  Erro ao configurar valores padrão:', error.message);
    }

    console.log('\n⚠️  IMPORTANTE: Execute o seguinte comando no Supabase SQL Editor:');
    console.log('');
    console.log('-- Adicionar coluna season_status');
    console.log('ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS season_status VARCHAR(20) DEFAULT \'active\';');
    console.log('');
    console.log('-- Configurar valores padrão');
    console.log('UPDATE game_competitions SET season_status = \'active\' WHERE season_status IS NULL;');
    console.log('');
    console.log('-- Verificar configuração');
    console.log('SELECT name, tier, season_year, season_status FROM game_competitions ORDER BY tier;');

    console.log('\n📋 4. Verificando configuração atual...');
    
    const { data: currentCompetitions, error: currentError } = await supabase
      .from('game_competitions')
      .select('name, tier, season_year, promotion_spots, relegation_spots')
      .order('tier', { ascending: true });

    if (currentError) {
      console.error('❌ Erro ao verificar competições:', currentError);
      return;
    }

    console.log('📊 Competições atuais:');
    currentCompetitions.forEach(comp => {
      console.log(`   - ${comp.name} (Tier ${comp.tier}): Temporada ${comp.season_year || 'N/A'}, Promoção ${comp.promotion_spots || 0}, Rebaixamento ${comp.relegation_spots || 0}`);
    });

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Execute o comando SQL no Supabase SQL Editor');
    console.log('2. Execute novamente o script implement-season-system.js');
    console.log('3. Teste o sistema de temporadas');

  } catch (error) {
    console.error('❌ Erro durante a adição da coluna:', error);
  }
}

addSeasonStatusColumn(); 