const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🔧 ADICIONANDO COLUNAS PARA SISTEMA DE PROMOÇÃO');
console.log('=' .repeat(50));

async function addCompetitionColumns() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Adicionando coluna is_open_for_new_users...');
    
    // Adicionar coluna is_open_for_new_users
    const { error: alterError1 } = await supabase
      .from('game_competitions')
      .update({}) // Operação vazia para forçar atualização do schema
      .eq('id', '00000000-0000-0000-0000-000000000000'); // ID inexistente
    
    if (alterError1 && alterError1.message.includes('is_open_for_new_users')) {
      console.log('✅ Coluna is_open_for_new_users já existe');
    } else {
      console.log('📋 Tentando adicionar coluna via SQL...');
      
      // Tentar adicionar via SQL direto
      const { error: sqlError } = await supabase
        .rpc('exec_sql', { 
          sql_query: 'ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS is_open_for_new_users BOOLEAN DEFAULT false;' 
        });
      
      if (sqlError) {
        console.log('⚠️  Não foi possível adicionar a coluna via script. Execute manualmente no Supabase SQL Editor:');
        console.log('ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS is_open_for_new_users BOOLEAN DEFAULT false;');
        console.log('ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS season_year INTEGER DEFAULT 2025;');
        console.log('ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS season_status VARCHAR(20) DEFAULT \'active\';');
        return;
      }
    }
    
    console.log('\n📋 2. Configurando competições...');
    
    // Configurar Série D como aberta para novos usuários
    const { error: updateError1 } = await supabase
      .from('game_competitions')
      .update({ is_open_for_new_users: true })
      .eq('tier', 4);
    
    if (updateError1) {
      console.log('❌ Erro ao configurar Série D:', updateError1.message);
    } else {
      console.log('✅ Série D configurada como aberta para novos usuários');
    }
    
    // Configurar outras séries como fechadas para novos usuários
    const { error: updateError2 } = await supabase
      .from('game_competitions')
      .update({ is_open_for_new_users: false })
      .lt('tier', 4);
    
    if (updateError2) {
      console.log('❌ Erro ao configurar outras séries:', updateError2.message);
    } else {
      console.log('✅ Outras séries configuradas como fechadas para novos usuários');
    }
    
    // Verificar resultado
    console.log('\n📋 3. Verificando configuração...');
    const { data: competitions, error: checkError } = await supabase
      .from('game_competitions')
      .select('name, tier, is_open_for_new_users, promotion_spots, relegation_spots')
      .order('tier');
    
    if (checkError) {
      console.log('❌ Erro ao verificar configuração:', checkError.message);
    } else {
      console.log('📊 Configuração das competições:');
      competitions.forEach(comp => {
        const status = comp.is_open_for_new_users ? '🆕 ABERTA' : '🔒 FECHADA';
        console.log(`  - ${comp.name} (Série ${comp.tier}): ${status} para novos usuários`);
      });
    }
    
    console.log('\n✅ Colunas adicionadas e competições configuradas!');
    console.log('💡 Agora novos usuários só podem se inscrever na Série D');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
  }
}

// Executar adição de colunas
if (require.main === module) {
  addCompetitionColumns();
}

module.exports = {
  addCompetitionColumns
}; 