const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://kmiza27-supabase.h4xd66.easypanel.host/';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAcademyColumns() {
  try {
    console.log('🧪 Testando se as colunas de treinamento foram criadas...\n');

    // 1. Verificar colunas em game_players
    console.log('🔍 Verificando colunas em game_players...');
    const { data: gameColumns, error: gameError } = await supabase
      .from('game_players')
      .select('id, name, is_in_academy, training_focus, training_intensity, training_type, updated_at')
      .limit(1);

    if (gameError) {
      console.log('❌ Erro ao verificar game_players:', gameError.message);
    } else {
      console.log('✅ game_players - colunas de treinamento funcionando!');
      if (gameColumns && gameColumns.length > 0) {
        const player = gameColumns[0];
        console.log(`   - is_in_academy: ${player.is_in_academy}`);
        console.log(`   - training_focus: ${player.training_focus}`);
        console.log(`   - training_intensity: ${player.training_intensity}`);
        console.log(`   - training_type: ${player.training_type}`);
      }
    }

    // 2. Verificar colunas em youth_players
    console.log('\n🔍 Verificando colunas em youth_players...');
    const { data: youthColumns, error: youthError } = await supabase
      .from('youth_players')
      .select('id, name, is_in_academy, training_focus, training_intensity, training_type, updated_at')
      .limit(1);

    if (youthError) {
      console.log('❌ Erro ao verificar youth_players:', youthError.message);
    } else {
      console.log('✅ youth_players - colunas de treinamento funcionando!');
      if (youthColumns && youthColumns.length > 0) {
        const player = youthColumns[0];
        console.log(`   - is_in_academy: ${player.is_in_academy}`);
        console.log(`   - training_focus: ${player.training_focus}`);
        console.log(`   - training_intensity: ${player.training_intensity}`);
        console.log(`   - training_type: ${player.training_type}`);
      }
    }

    // 3. Verificar se a tabela de logs existe
    console.log('\n🔍 Verificando tabela de logs...');
    const { data: logs, error: logsError } = await supabase
      .from('game_academy_logs')
      .select('*')
      .limit(1);

    if (logsError) {
      console.log('❌ Erro ao verificar game_academy_logs:', logsError.message);
    } else {
      console.log('✅ game_academy_logs - tabela funcionando!');
    }

    // 4. Testar inserção de dados de treinamento
    console.log('\n🧪 Testando inserção de dados de treinamento...');
    
    // Buscar um time para teste
    const { data: teams, error: teamsError } = await supabase
      .from('game_teams')
      .select('id, name')
      .limit(1);

    if (teamsError || !teams || teams.length === 0) {
      console.log('⚠️ Nenhum time encontrado para teste');
    } else {
      const testTeam = teams[0];
      console.log(`📋 Time de teste: ${testTeam.name}`);
      
      // Testar atualização de treinamento
      if (gameColumns && gameColumns.length > 0) {
        const testPlayer = gameColumns[0];
        console.log(`🎯 Testando atualização para jogador: ${testPlayer.name}`);
        
        const { error: updateError } = await supabase
          .from('game_players')
          .update({
            training_focus: 'SHO',
            training_intensity: 'high',
            training_type: 'professional',
            updated_at: new Date().toISOString()
          })
          .eq('id', testPlayer.id);
        
        if (updateError) {
          console.log('❌ Erro ao atualizar treinamento:', updateError.message);
        } else {
          console.log('✅ Atualização de treinamento funcionando!');
        }
      }
    }

    console.log('\n🎉 Teste das colunas de treinamento concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    process.exit(0);
  }
}

// Executar teste
testAcademyColumns().catch(console.error);
