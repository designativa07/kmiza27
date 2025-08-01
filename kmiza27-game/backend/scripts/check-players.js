const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração para o Supabase na VPS
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlayers() {
  try {
    console.log('🔍 Verificando jogadores do time...');
    
    const teamId = '470f3b28-1e00-4d01-982f-6f7018257d61';
    
    const { data: players, error } = await supabase
      .from('youth_players')
      .select('*')
      .eq('team_id', teamId)
      .order('position', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar jogadores:', error);
      return;
    }

    console.log(`✅ ${players.length} jogadores encontrados!`);

    // Mostrar estatísticas por posição
    const positions = {};
    players.forEach(player => {
      positions[player.position] = (positions[player.position] || 0) + 1;
    });

    console.log('\n📊 Distribuição por posição:');
    Object.entries(positions).forEach(([position, count]) => {
      console.log(`  ${position}: ${count} jogadores`);
    });

    // Mostrar alguns jogadores como exemplo
    console.log('\n👥 Exemplos de jogadores:');
    players.slice(0, 8).forEach(player => {
      const attrs = player.attributes;
      console.log(`  ${player.name} - ${player.position}`);
      console.log(`    Atributos: Velocidade(${attrs.pace}) Finalização(${attrs.shooting}) Passe(${attrs.passing})`);
    });

    console.log('\n🎉 Verificação concluída com sucesso!');

  } catch (error) {
    console.error('💥 Erro na verificação:', error);
  }
}

checkPlayers().then(() => process.exit(0)).catch(() => process.exit(1)); 