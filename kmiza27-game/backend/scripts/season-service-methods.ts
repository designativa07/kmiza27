
  // ===== SISTEMA DE TEMPORADAS =====
  
  async getSeasonStatus() {
    try {
      const { data, error } = await supabase
        .from('game_competitions')
        .select('name, tier, season_year, status, current_teams, max_teams')
        .order('tier', { ascending: true });

      if (error) throw new Error(`Error fetching season status: ${error.message}`);
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

      if (compError) throw new Error(`Error fetching competitions: ${compError.message}`);

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
            .select(`
              *,
              game_teams!inner(id, name, team_type)
            `)
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
            .select(`
              *,
              game_teams!inner(id, name, team_type)
            `)
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

      if (error) throw new Error(`Error starting new season: ${error.message}`);

      return {
        success: true,
        message: 'Nova temporada iniciada com sucesso'
      };
    } catch (error) {
      this.logger.error('Error starting new season:', error);
      throw error;
    }
  }
