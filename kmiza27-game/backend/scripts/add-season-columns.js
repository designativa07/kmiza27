const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🔧 ADICIONANDO COLUNAS PARA SISTEMA DE TEMPORADAS');
console.log('=' .repeat(50));

async function addSeasonColumns() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Verificando estrutura atual da tabela game_competitions...');
    
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

    console.log('\n📋 2. Tentando adicionar colunas via RPC...');
    
    try {
      // Tentar adicionar colunas via RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE game_competitions 
          ADD COLUMN IF NOT EXISTS season_year INTEGER DEFAULT 2025;
          
          ALTER TABLE game_competitions 
          ADD COLUMN IF NOT EXISTS season_status VARCHAR(20) DEFAULT 'active';
          
          ALTER TABLE game_competitions 
          ADD COLUMN IF NOT EXISTS is_open_for_new_users BOOLEAN DEFAULT false;
        `
      });

      if (rpcError) {
        console.log('⚠️  RPC não disponível, fornecendo comandos SQL manuais');
      } else {
        console.log('✅ Colunas adicionadas via RPC');
      }
    } catch (error) {
      console.log('⚠️  RPC não disponível');
    }

    console.log('\n📋 3. Configurando valores padrão...');
    
    // Configurar valores padrão para as colunas
    const { error: updateError } = await supabase
      .from('game_competitions')
      .update({
        season_year: 2025,
        season_status: 'active'
      })
      .is('season_year', null);

    if (updateError) {
      console.log('⚠️  Não foi possível atualizar valores padrão via script');
    } else {
      console.log('✅ Valores padrão configurados');
    }

    console.log('\n📋 4. Configurando competições para novos usuários...');
    
    // Configurar Série D como aberta para novos usuários
    const { error: tierError } = await supabase
      .from('game_competitions')
      .update({ is_open_for_new_users: true })
      .eq('tier', 4);

    if (tierError) {
      console.log('⚠️  Não foi possível configurar tier 4');
    } else {
      console.log('✅ Série D configurada como aberta para novos usuários');
    }

    console.log('\n⚠️  IMPORTANTE: Execute os seguintes comandos no Supabase SQL Editor:');
    console.log('');
    console.log('-- Adicionar colunas para sistema de temporadas');
    console.log('ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS season_year INTEGER DEFAULT 2025;');
    console.log('ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS season_status VARCHAR(20) DEFAULT \'active\';');
    console.log('ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS is_open_for_new_users BOOLEAN DEFAULT false;');
    console.log('');
    console.log('-- Configurar competições para novos usuários');
    console.log('UPDATE game_competitions SET is_open_for_new_users = true WHERE tier = 4;');
    console.log('UPDATE game_competitions SET is_open_for_new_users = false WHERE tier < 4;');
    console.log('');
    console.log('-- Verificar configuração');
    console.log('SELECT name, tier, season_year, season_status, is_open_for_new_users FROM game_competitions ORDER BY tier;');

    console.log('\n📋 5. Verificando configuração atual...');
    
    const { data: currentCompetitions, error: currentError } = await supabase
      .from('game_competitions')
      .select('name, tier, promotion_spots, relegation_spots')
      .order('tier', { ascending: true });

    if (currentError) {
      console.error('❌ Erro ao verificar competições:', currentError);
      return;
    }

    console.log('📊 Competições atuais:');
    currentCompetitions.forEach(comp => {
      console.log(`   - ${comp.name} (Tier ${comp.tier}): Promoção ${comp.promotion_spots || 0}, Rebaixamento ${comp.relegation_spots || 0}`);
    });

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Execute os comandos SQL no Supabase SQL Editor');
    console.log('2. Execute novamente o script implement-season-system.js');
    console.log('3. Teste o sistema de temporadas');

  } catch (error) {
    console.error('❌ Erro durante a adição das colunas:', error);
  }
}

addSeasonColumns(); 