const { getSupabaseServiceClient } = require('../config/supabase-connection');

console.log('🔧 INTEGRANDO SISTEMA DE TEMPORADAS COM BACKEND');
console.log('=' .repeat(50));

async function integrateSeasonSystem() {
  try {
    console.log('\n📋 1. Verificando estrutura do backend...');
    
    // Verificar se o arquivo de competições existe
    const fs = require('fs');
    const path = require('path');
    
    const competitionsServicePath = path.join(__dirname, '../src/modules/competitions/competitions.service.ts');
    const competitionsControllerPath = path.join(__dirname, '../src/modules/competitions/competitions.controller.ts');
    
    if (!fs.existsSync(competitionsServicePath)) {
      console.error('❌ Arquivo competitions.service.ts não encontrado');
      return;
    }
    
    if (!fs.existsSync(competitionsControllerPath)) {
      console.error('❌ Arquivo competitions.controller.ts não encontrado');
      return;
    }
    
    console.log('✅ Arquivos do backend encontrados');

    console.log('\n📋 2. Verificando métodos existentes...');
    
    const serviceContent = fs.readFileSync(competitionsServicePath, 'utf8');
    const controllerContent = fs.readFileSync(competitionsControllerPath, 'utf8');
    
    // Verificar se o método getCompetitionsForNewUsers já existe
    if (serviceContent.includes('getCompetitionsForNewUsers')) {
      console.log('✅ Método getCompetitionsForNewUsers já existe');
    } else {
      console.log('❌ Método getCompetitionsForNewUsers não encontrado');
    }
    
    // Verificar se o endpoint /for-new-users já existe
    if (controllerContent.includes('for-new-users')) {
      console.log('✅ Endpoint /for-new-users já existe');
    } else {
      console.log('❌ Endpoint /for-new-users não encontrado');
    }

    console.log('\n📋 3. Criando métodos para sistema de temporadas...');
    
    // Métodos para adicionar ao service
    const seasonMethods = `
  // ===== SISTEMA DE TEMPORADAS =====
  
  async getSeasonStatus() {
    try {
      const { data, error } = await supabase
        .from('game_competitions')
        .select('name, tier, season_year, status, current_teams, max_teams')
        .order('tier', { ascending: true });

      if (error) throw new Error(\`Error fetching season status: \${error.message}\`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting season status:', error);
      throw error;
    }
  }

  async endSeason() {
    try {
      // Buscar todas as competições ativas
      const { data: competitions, error: compError } = await supabase
        .from('game_competitions')
        .select('id, name, tier, promotion_spots, relegation_spots')
        .eq('status', 'active')
        .order('tier', { ascending: true });

      if (compError) throw new Error(\`Error fetching competitions: \${compError.message}\`);

      const results = [];

      // Processar promoção/rebaixamento para cada competição
      for (const competition of competitions) {
        const competitionResult = {
          competition: competition.name,
          promoted: [],
          relegated: []
        };

        // Buscar times para promoção (se não for Série A)
        if (competition.tier > 1) {
          const { data: topTeams, error: topError } = await supabase
            .from('game_standings')
            .select(\`
              *,
              game_teams!inner(id, name, team_type)
            \`)
            .eq('competition_id', competition.id)
            .order('points', { ascending: false })
            .limit(competition.promotion_spots || 4);

          if (!topError && topTeams) {
            const userTeamsToPromote = topTeams.filter(standing => 
              standing.game_teams.team_type === 'user_created'
            );

            if (userTeamsToPromote.length > 0) {
              // Encontrar competição superior
              const higherTier = competition.tier - 1;
              const { data: higherCompetition } = await supabase
                .from('game_competitions')
                .select('id, name')
                .eq('tier', higherTier)
                .single();

              if (higherCompetition) {
                for (const standing of userTeamsToPromote) {
                  // Remover da competição atual
                  await supabase
                    .from('game_competition_teams')
                    .delete()
                    .eq('competition_id', competition.id)
                    .eq('team_id', standing.team_id);

                  // Adicionar à competição superior
                  await supabase
                    .from('game_competition_teams')
                    .insert({
                      competition_id: higherCompetition.id,
                      team_id: standing.team_id,
                      registered_at: new Date().toISOString()
                    });

                  competitionResult.promoted.push({
                    team: standing.game_teams.name,
                    from: competition.name,
                    to: higherCompetition.name
                  });
                }
              }
            }
          }
        }

        // Buscar times para rebaixamento (se não for Série D)
        if (competition.tier < 4) {
          const { data: bottomTeams, error: bottomError } = await supabase
            .from('game_standings')
            .select(\`
              *,
              game_teams!inner(id, name, team_type)
            \`)
            .eq('competition_id', competition.id)
            .order('points', { ascending: true })
            .limit(competition.relegation_spots || 4);

          if (!bottomError && bottomTeams) {
            const machineTeamsToRelegate = bottomTeams.filter(standing => 
              standing.game_teams.team_type === 'machine'
            );

            if (machineTeamsToRelegate.length > 0) {
              // Encontrar competição inferior
              const lowerTier = competition.tier + 1;
              const { data: lowerCompetition } = await supabase
                .from('game_competitions')
                .select('id, name')
                .eq('tier', lowerTier)
                .single();

              if (lowerCompetition) {
                for (const standing of machineTeamsToRelegate) {
                  // Remover da competição atual
                  await supabase
                    .from('game_competition_teams')
                    .delete()
                    .eq('competition_id', competition.id)
                    .eq('team_id', standing.team_id);

                  // Adicionar à competição inferior
                  await supabase
                    .from('game_competition_teams')
                    .insert({
                      competition_id: lowerCompetition.id,
                      team_id: standing.team_id,
                      registered_at: new Date().toISOString()
                    });

                  competitionResult.relegated.push({
                    team: standing.game_teams.name,
                    from: competition.name,
                    to: lowerCompetition.name
                  });
                }
              }
            }
          }
        }

        results.push(competitionResult);
      }

      // Atualizar contadores das competições
      for (const competition of competitions) {
        const { count: teamCount } = await supabase
          .from('game_competition_teams')
          .select('*', { count: 'exact', head: true })
          .eq('competition_id', competition.id);

        await supabase
          .from('game_competitions')
          .update({ current_teams: teamCount || 0 })
          .eq('id', competition.id);
      }

      // Finalizar temporada atual
      const currentYear = competitions[0]?.season_year || 2025;
      await supabase
        .from('game_competitions')
        .update({ 
          status: 'finished',
          season_year: currentYear + 1
        })
        .eq('status', 'active');

      return {
        success: true,
        message: 'Temporada finalizada com sucesso',
        results
      };

    } catch (error) {
      this.logger.error('Error ending season:', error);
      throw error;
    }
  }

  async startNewSeason() {
    try {
      const { error } = await supabase
        .from('game_competitions')
        .update({ 
          status: 'active',
          season_year: new Date().getFullYear()
        })
        .eq('status', 'finished');

      if (error) throw new Error(\`Error starting new season: \${error.message}\`);

      return {
        success: true,
        message: 'Nova temporada iniciada com sucesso'
      };
    } catch (error) {
      this.logger.error('Error starting new season:', error);
      throw error;
    }
  }
`;

    // Endpoints para adicionar ao controller
    const seasonEndpoints = `
  // ===== SISTEMA DE TEMPORADAS =====
  
  @Get('season/status')
  async getSeasonStatus() {
    try {
      const seasonStatus = await this.competitionsService.getSeasonStatus();
      return {
        success: true,
        data: seasonStatus,
        message: 'Status da temporada carregado com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar status da temporada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('season/end')
  async endSeason() {
    try {
      const result = await this.competitionsService.endSeason();
      return {
        success: true,
        data: result,
        message: 'Temporada finalizada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao finalizar temporada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('season/start')
  async startNewSeason() {
    try {
      const result = await this.competitionsService.startNewSeason();
      return {
        success: true,
        data: result,
        message: 'Nova temporada iniciada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao iniciar nova temporada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
`;

    console.log('\n📋 4. Gerando arquivos de integração...');
    
    // Criar arquivo com os métodos para adicionar ao service
    const serviceMethodsPath = path.join(__dirname, 'season-service-methods.ts');
    fs.writeFileSync(serviceMethodsPath, seasonMethods);
    console.log('✅ Métodos do service gerados em: season-service-methods.ts');

    // Criar arquivo com os endpoints para adicionar ao controller
    const controllerEndpointsPath = path.join(__dirname, 'season-controller-endpoints.ts');
    fs.writeFileSync(controllerEndpointsPath, seasonEndpoints);
    console.log('✅ Endpoints do controller gerados em: season-controller-endpoints.ts');

    console.log('\n📋 5. Testando integração...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    // Testar se conseguimos acessar as competições
    const { data: testCompetitions, error: testError } = await supabase
      .from('game_competitions')
      .select('name, tier, status, season_year')
      .limit(3);

    if (testError) {
      console.error('❌ Erro ao testar acesso ao banco:', testError);
    } else {
      console.log('✅ Acesso ao banco de dados funcionando');
      console.log('📊 Competições de teste:', testCompetitions?.map(c => c.name));
    }

    console.log('\n🎯 INTEGRAÇÃO DO SISTEMA DE TEMPORADAS:');
    console.log('✅ Métodos do service gerados');
    console.log('✅ Endpoints do controller gerados');
    console.log('✅ Acesso ao banco de dados testado');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Adicione os métodos de season-service-methods.ts ao competitions.service.ts');
    console.log('2. Adicione os endpoints de season-controller-endpoints.ts ao competitions.controller.ts');
    console.log('3. Reinicie o backend NestJS');
    console.log('4. Teste os novos endpoints:');
    console.log('   - GET /api/v1/competitions/season/status');
    console.log('   - POST /api/v1/competitions/season/end');
    console.log('   - POST /api/v1/competitions/season/start');

  } catch (error) {
    console.error('❌ Erro durante a integração:', error);
  }
}

integrateSeasonSystem(); 