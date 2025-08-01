const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🏆 CONFIGURANDO SISTEMA DE PROMOÇÃO SIMPLIFICADO');
console.log('=' .repeat(50));

async function setupPromotionSystemSimple() {
  try {
    const supabase = getSupabaseServiceClient('vps');
    
    console.log('\n📋 1. Configurando competições para sistema de promoção...');
    
    // Buscar todas as competições
    const { data: competitions, error: compError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams, min_teams, promotion_spots, relegation_spots');
    
    if (compError) {
      console.log('❌ Erro ao buscar competições:', compError.message);
      return;
    }
    
    console.log(`📊 Competições encontradas: ${competitions.length}`);
    
    // Configurar cada competição
    for (const competition of competitions) {
      console.log(`\n📋 2. Configurando ${competition.name}...`);
      
      let updateData = {};
      
      switch (competition.tier) {
        case 1: // Série A
          updateData = {
            promotion_spots: 0, // Não sobe ninguém
            relegation_spots: 4 // 4 rebaixam para Série B
          };
          break;
        case 2: // Série B
          updateData = {
            promotion_spots: 4, // 4 sobem para Série A
            relegation_spots: 4 // 4 rebaixam para Série C
          };
          break;
        case 3: // Série C
          updateData = {
            promotion_spots: 4, // 4 sobem para Série B
            relegation_spots: 4 // 4 rebaixam para Série D
          };
          break;
        case 4: // Série D
          updateData = {
            promotion_spots: 4, // 4 sobem para Série C
            relegation_spots: 0 // Não rebaixa ninguém
          };
          break;
      }
      
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update(updateData)
        .eq('id', competition.id);
      
      if (updateError) {
        console.log(`❌ Erro ao atualizar ${competition.name}: ${updateError.message}`);
      } else {
        console.log(`✅ ${competition.name} configurada:`);
        console.log(`   - Promoção: ${updateData.promotion_spots} times`);
        console.log(`   - Rebaixamento: ${updateData.relegation_spots} times`);
      }
    }
    
    // Limpar todas as competições exceto Série D
    console.log('\n📋 3. Limpando competições superiores...');
    
    for (const competition of competitions) {
      if (competition.tier < 4) { // Série A, B, C
        console.log(`📋 Limpando ${competition.name}...`);
        
        // Remover todos os times inscritos
        const { data: enrolledTeams, error: teamsError } = await supabase
          .from('game_competition_teams')
          .select('id')
          .eq('competition_id', competition.id);
        
        if (teamsError) {
          console.log(`❌ Erro ao buscar times inscritos: ${teamsError.message}`);
          continue;
        }
        
        if (enrolledTeams && enrolledTeams.length > 0) {
          console.log(`📊 Removendo ${enrolledTeams.length} times de ${competition.name}...`);
          
          for (const team of enrolledTeams) {
            const { error: deleteError } = await supabase
              .from('game_competition_teams')
              .delete()
              .eq('id', team.id);
            
            if (deleteError) {
              console.log(`❌ Erro ao remover time: ${deleteError.message}`);
            }
          }
          
          // Atualizar contador
          const { error: updateError } = await supabase
            .from('game_competitions')
            .update({ current_teams: 0 })
            .eq('id', competition.id);
          
          if (updateError) {
            console.log(`❌ Erro ao atualizar contador: ${updateError.message}`);
          } else {
            console.log(`✅ ${competition.name} limpa`);
          }
        } else {
          console.log(`✅ ${competition.name} já está vazia`);
        }
      }
    }
    
    // Configurar Série D para aceitar novos usuários
    console.log('\n📋 4. Configurando Série D para novos usuários...');
    
    const serieD = competitions.find(c => c.tier === 4);
    if (serieD) {
      // Garantir que há espaço na Série D
      const { data: enrolledTeams, error: countError } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', serieD.id);
      
      if (countError) {
        console.log(`❌ Erro ao contar times: ${countError.message}`);
      } else {
        const currentCount = enrolledTeams ? enrolledTeams.length : 0;
        console.log(`📊 Série D: ${currentCount}/${serieD.max_teams} times`);
        
        if (currentCount >= serieD.max_teams) {
          console.log(`⚠️  Série D está cheia, removendo alguns times da máquina...`);
          
          // Remover alguns times da máquina para deixar espaço
          const { data: machineTeams, error: machineError } = await supabase
            .from('game_competition_teams')
            .select(`
              id,
              game_teams!inner(name, team_type)
            `)
            .eq('competition_id', serieD.id)
            .eq('game_teams.team_type', 'machine')
            .limit(10); // Deixar 10 vagas
          
          if (machineTeams && machineTeams.length > 0) {
            for (const team of machineTeams) {
              const { error: deleteError } = await supabase
                .from('game_competition_teams')
                .delete()
                .eq('id', team.id);
              
              if (!deleteError) {
                console.log(`✅ Time ${team.game_teams.name} removido da Série D`);
              }
            }
          }
        }
      }
    }
    
    // Verificar resultado final
    console.log('\n📋 5. Verificando resultado final...');
    const { data: finalCompetitions, error: finalError } = await supabase
      .from('game_competitions')
      .select('id, name, tier, current_teams, max_teams, promotion_spots, relegation_spots');
    
    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
      return;
    }
    
    console.log('📊 Status final das competições:');
    finalCompetitions.forEach(comp => {
      const status = comp.tier === 4 ? '🆕 ABERTA PARA NOVOS USUÁRIOS' : '🔒 FECHADA PARA NOVOS USUÁRIOS';
      console.log(`  - ${comp.name} (Série ${comp.tier}): ${comp.current_teams}/${comp.max_teams} times`);
      console.log(`    ${status} | Promoção: ${comp.promotion_spots} | Rebaixamento: ${comp.relegation_spots}`);
    });
    
    console.log('\n✅ Sistema de promoção configurado!');
    console.log('💡 Agora novos usuários só podem se inscrever na Série D');
    console.log('🏆 Para subir de divisão, é preciso ficar entre os 4 primeiros');
    console.log('\n⚠️  IMPORTANTE: Execute no Supabase SQL Editor:');
    console.log('ALTER TABLE game_competitions ADD COLUMN IF NOT EXISTS is_open_for_new_users BOOLEAN DEFAULT false;');
    console.log('UPDATE game_competitions SET is_open_for_new_users = true WHERE tier = 4;');
    console.log('UPDATE game_competitions SET is_open_for_new_users = false WHERE tier < 4;');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
  }
}

// Executar configuração
if (require.main === module) {
  setupPromotionSystemSimple();
}

module.exports = {
  setupPromotionSystemSimple
}; 