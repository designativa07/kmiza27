const { getSupabaseClient } = require('../config/supabase-connection');

async function processPromotionManually() {
  try {
    console.log('🧪 PROCESSAMENTO: Promoção manual do usuário\n');
    
    const supabase = getSupabaseClient('vps');
    
    // 1. Buscar o usuário que terminou em 2º na Série C
    console.log('1️⃣ Identificando usuário para promoção...');
    const { data: serieCUsers } = await supabase
      .from('game_user_competition_progress')
      .select('*')
      .eq('current_tier', 3) // Série C
      .eq('games_played', 38) // Temporada completa
      .eq('position', 2) // 2º lugar
      .order('season_year', { ascending: false });
    
    if (!serieCUsers || serieCUsers.length === 0) {
      console.log('❌ Nenhum usuário encontrado em 2º lugar na Série C');
      return;
    }
    
    const userToPromote = serieCUsers[0];
    console.log(`✅ Usuário encontrado:`);
    console.log(`   User ID: ${userToPromote.user_id}`);
    console.log(`   Temporada: ${userToPromote.season_year}`);
    console.log(`   Posição: ${userToPromote.position}º lugar`);
    console.log(`   Pontos: ${userToPromote.points}`);
    
    // 2. Chamar a API correta de fim de temporada
    console.log('\n2️⃣ Processando fim de temporada via API...');
    
    try {
      const response = await fetch('http://localhost:3001/api/promotion-relegation/process-season-end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToPromote.user_id,
          seasonYear: userToPromote.season_year
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ API processou com sucesso!');
        console.log(`   Resultado: ${result.data?.season_result?.result}`);
        console.log(`   Descrição: ${result.data?.season_result?.description}`);
        console.log(`   Série atual: ${getTierName(result.data?.season_result?.current_tier)}`);
        console.log(`   Próxima série: ${getTierName(result.data?.next_tier)}`);
        console.log(`   Mensagem: ${result.message}`);
        
        if (result.data?.season_result?.result === 'promoted') {
          console.log('\n🎉 PROMOÇÃO PROCESSADA COM SUCESSO!');
          
          // 3. Verificar se nova temporada foi criada
          console.log('\n3️⃣ Verificando nova temporada na Série B...');
          
          await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
          
          const { data: newSeasonData } = await supabase
            .from('game_user_competition_progress')
            .select('*')
            .eq('user_id', userToPromote.user_id)
            .eq('current_tier', 2) // Série B
            .order('season_year', { ascending: false });
          
          if (newSeasonData && newSeasonData.length > 0) {
            const newSeason = newSeasonData[0];
            console.log('✅ Nova temporada criada na Série B:');
            console.log(`   Temporada: ${newSeason.season_year}`);
            console.log(`   Série: ${getTierName(newSeason.current_tier)}`);
            console.log(`   Pontos: ${newSeason.points}`);
            console.log(`   Jogos: ${newSeason.games_played}/38`);
            console.log(`   Status: ${newSeason.season_status}`);
            
            console.log('\n🎮 SUCESSO TOTAL! Usuário promovido para Série B');
            console.log('🏆 Agora ele pode jogar na segunda divisão!');
          } else {
            console.log('⚠️ Nova temporada não foi encontrada ainda');
            console.log('💡 Pode levar alguns segundos para aparecer');
          }
        }
      } else {
        console.log(`❌ API retornou erro: ${result.error}`);
      }
      
    } catch (apiError) {
      console.log(`❌ Erro na chamada da API: ${apiError.message}`);
      
      // 4. Fallback: Processar diretamente no banco (se API falhar)
      console.log('\n🔧 Fallback: Processando diretamente no banco...');
      
      try {
        // Finalizar temporada atual
        const { error: finishError } = await supabase
          .from('game_user_competition_progress')
          .update({
            season_status: 'finished'
          })
          .eq('user_id', userToPromote.user_id)
          .eq('season_year', userToPromote.season_year)
          .eq('current_tier', 3);
        
        if (finishError) {
          throw new Error(`Erro ao finalizar temporada: ${finishError.message}`);
        }
        
        console.log('✅ Temporada atual finalizada');
        
        // Criar nova temporada na Série B
        const newSeasonYear = userToPromote.season_year + 1;
        
        const { error: createError } = await supabase
          .from('game_user_competition_progress')
          .insert({
            user_id: userToPromote.user_id,
            team_id: userToPromote.team_id,
            current_tier: 2, // Série B
            season_year: newSeasonYear,
            position: 1, // Posição inicial
            points: 0,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            season_status: 'active'
          });
        
        if (createError) {
          throw new Error(`Erro ao criar nova temporada: ${createError.message}`);
        }
        
        console.log('✅ Nova temporada criada na Série B');
        console.log('\n🎉 PROMOÇÃO MANUAL CONCLUÍDA!');
        console.log('🏆 Usuário promovido para Série B com sucesso!');
        
      } catch (dbError) {
        console.log(`❌ Erro no processamento manual: ${dbError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

function getTierName(tier) {
  const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
  return tierNames[tier] || `${tier}`;
}

// Executar processamento
processPromotionManually();