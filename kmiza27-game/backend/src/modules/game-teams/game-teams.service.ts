import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class GameTeamsService {
  private readonly logger = new Logger(GameTeamsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async createTeam(userId: string, teamData: any) {
    try {
      // Verificar se o usuário existe, se não, criar um
      let actualUserId = userId;
      
      // Se o userId não for um UUID válido, criar um usuário padrão
      if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Verificar se já existe um usuário criado anteriormente
        const { data: existingUsers, error: userError } = await supabase
          .from('game_users')
          .select('id')
          .limit(1);

        if (userError) {
          throw new Error(`Error checking users: ${userError.message}`);
        }

        if (existingUsers && existingUsers.length > 0) {
          actualUserId = existingUsers[0].id;
        } else {
          // Criar um usuário padrão
          const { data: newUser, error: createError } = await supabase
            .from('game_users')
            .insert({
              email: `user-${Date.now()}@kmiza27.com`,
              username: `user-${Date.now()}`,
              display_name: 'Usuário do Jogo'
            })
            .select()
            .single();

          if (createError) {
            throw new Error(`Error creating user: ${createError.message}`);
          }

          actualUserId = newUser.id;
          this.logger.log(`Created new user: ${actualUserId}`);
        }
      } else {
        // Para UUIDs válidos, verificar se existe
        try {
          const { data: existingUser, error: userError } = await supabase
            .from('game_users')
            .select('id')
            .eq('id', userId)
            .single();

          if (userError || !existingUser) {
            // Criar usuário se não existir
            const { data: newUser, error: createError } = await supabase
              .from('game_users')
              .insert({
                email: `user-${Date.now()}@kmiza27.com`,
                username: `user-${Date.now()}`,
                display_name: 'Usuário do Jogo'
              })
              .select()
              .single();

            if (createError) {
              throw new Error(`Error creating user: ${createError.message}`);
            }

            actualUserId = newUser.id;
            this.logger.log(`Created new user: ${actualUserId}`);
          }
        } catch (error) {
          this.logger.error('Error checking/creating user:', error);
          throw error;
        }
      }

      // Gerar slug único
      const slug = await this.generateUniqueSlug(teamData.name);
      
      const newTeam = {
        ...teamData,
        slug,
        owner_id: actualUserId,
        team_type: 'user_created',
        created_at: new Date().toISOString()
      };

      const team = await this.supabaseService.createGameTeam(newTeam);
      
      // Criar academia básica para o time
      await this.createBasicAcademy(team.id);
      
      // Criar 23 jogadores para o time
      await this.createInitialPlayers(team.id);
      
      this.logger.log(`Team created successfully: ${team.name}`);
      return { team, actualUserId };
    } catch (error) {
      this.logger.error('Error creating team:', error);
      throw error;
    }
  }

  async getUserTeams(userId: string) {
    try {
      this.logger.log(`Getting teams for userId: ${userId}`);
      
      // Se o userId não for um UUID válido, usar o primeiro usuário disponível
      if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        this.logger.log(`Invalid userId provided: ${userId}, using default user`);
        
        // Buscar o primeiro usuário disponível
        const { data: existingUsers, error: userError } = await supabase
          .from('game_users')
          .select('id')
          .limit(1);

        if (userError || !existingUsers || existingUsers.length === 0) {
          this.logger.log('No users found, returning empty array');
          return [];
        }

        userId = existingUsers[0].id;
        this.logger.log(`Using default user: ${userId}`);
      }
      
      const teams = await this.supabaseService.getGameTeams(userId);
      this.logger.log(`Found ${teams.length} teams for user ${userId}`);
      return teams;
    } catch (error) {
      this.logger.error('Error fetching user teams:', error);
      throw error;
    }
  }

  async getTeamById(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('game_teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw new Error(`Error fetching team: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error fetching team:', error);
      throw error;
    }
  }

  async getTeamPlayers(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('youth_players')
        .select('*')
        .eq('team_id', teamId)
        .order('position', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw new Error(`Error fetching players: ${error.message}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error fetching team players:', error);
      throw error;
    }
  }

  async updateTeam(teamId: string, updateData: any) {
    try {
      const { data, error } = await supabase
        .from('game_teams')
        .update(updateData)
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw new Error(`Error updating team: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error updating team:', error);
      throw error;
    }
  }

  async deleteTeam(teamId: string, userId: string) {
    try {
      this.logger.log(`Attempting to delete team ${teamId} for user ${userId}`);
      
      // Verificar se o usuário é o dono do time
      const team = await this.getTeamById(teamId);
      this.logger.log(`Team found: ${team.name}, owner_id: ${team.owner_id}, userId: ${userId}`);
      
      if (team.owner_id !== userId) {
        this.logger.error(`Unauthorized: Team owner ${team.owner_id} != userId ${userId}`);
        throw new Error('Unauthorized: You can only delete your own teams');
      }

      const { error } = await supabase
        .from('game_teams')
        .delete()
        .eq('id', teamId);

      if (error) throw new Error(`Error deleting team: ${error.message}`);
      
      this.logger.log(`Team deleted successfully: ${teamId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting team:', error);
      throw error;
    }
  }

  private async createBasicAcademy(teamId: string) {
    try {
      const academyData = {
        team_id: teamId,
        level: 1,
        facilities: {
          training_fields: 1,
          gym_quality: 1,
          medical_center: 1,
          dormitory_capacity: 10,
          coaching_staff: 2
        },
        investment: 0,
        monthly_cost: 50000,
        efficiency_multiplier: 1.0
      };

      await supabase
        .from('youth_academies')
        .insert(academyData);

      this.logger.log(`Basic academy created for team: ${teamId}`);
    } catch (error) {
      this.logger.error('Error creating basic academy:', error);
      throw error;
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let counter = 1;
    let finalSlug = slug;

    while (await this.slugExists(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  private async slugExists(slug: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('game_teams')
        .select('id')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      this.logger.error('Error checking slug existence:', error);
      throw error;
    }
  }

  async getTeamStats(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('team_overview')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw new Error(`Error fetching team stats: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error fetching team stats:', error);
      throw error;
    }
  }

  async updateTeamBudget(teamId: string, amount: number, operation: 'add' | 'subtract') {
    try {
      const team = await this.getTeamById(teamId);
      const currentBudget = parseFloat(team.budget);
      
      let newBudget: number;
      if (operation === 'add') {
        newBudget = currentBudget + amount;
      } else {
        newBudget = currentBudget - amount;
        if (newBudget < 0) {
          throw new Error('Insufficient budget');
        }
      }

      const { data, error } = await supabase
        .from('game_teams')
        .update({ budget: newBudget })
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw new Error(`Error updating budget: ${error.message}`);
      
      this.logger.log(`Budget updated for team ${teamId}: ${operation} ${amount}`);
      return data;
    } catch (error) {
      this.logger.error('Error updating team budget:', error);
      throw error;
    }
  }

  async expandStadium(teamId: string, capacityIncrease: number, cost: number) {
    try {
      const team = await this.getTeamById(teamId);
      const currentBudget = parseFloat(team.budget);
      const currentCapacity = parseInt(team.stadium_capacity) || 0;
      
      // Verificar se tem orçamento suficiente
      if (currentBudget < cost) {
        throw new Error('Insufficient budget for stadium expansion');
      }

      // Calcular nova capacidade
      const newCapacity = currentCapacity + capacityIncrease;
      const newBudget = currentBudget - cost;

      // Atualizar capacidade e orçamento
      const { data, error } = await supabase
        .from('game_teams')
        .update({ 
          stadium_capacity: newCapacity,
          budget: newBudget 
        })
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw new Error(`Error expanding stadium: ${error.message}`);
      
      this.logger.log(`Stadium expanded for team ${teamId}: +${capacityIncrease} capacity, cost: ${cost}`);
      return data;
    } catch (error) {
      this.logger.error('Error expanding stadium:', error);
      throw error;
    }
  }

  async getTeamMatches(teamId: string) {
    try {
      // Buscar partidas diretas (PvP)
      const { data: directMatches, error: directError } = await supabase
        .from('game_direct_matches')
        .select('*')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('match_date', { ascending: true });

      if (directError) {
        this.logger.error('Error fetching direct matches:', directError);
      }

      // Buscar partidas de competição
      const { data: competitionMatches, error: compError } = await supabase
        .from('game_matches')
        .select('*')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('match_date', { ascending: true });

      if (compError) {
        this.logger.error('Error fetching competition matches:', compError);
      }

      // Combinar e ordenar todas as partidas
      const allMatches = [
        ...(directMatches || []),
        ...(competitionMatches || [])
      ].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

      return allMatches;
    } catch (error) {
      this.logger.error('Error fetching team matches:', error);
      throw error;
    }
  }

  async createMatch(matchData: any) {
    try {
      // Verificar se os times existem, se não, criar automaticamente
      const homeTeamId = await this.ensureTeamExists(matchData.home_team_id, matchData.home_team_name);
      const awayTeamId = await this.ensureTeamExists(matchData.away_team_id, matchData.away_team_name);

      // Atualizar os IDs com os times reais
      const matchDataWithRealIds = {
        ...matchData,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId
      };

      const { data, error } = await supabase
        .from('game_matches')
        .insert(matchDataWithRealIds)
        .select()
        .single();

      if (error) throw new Error(`Error creating match: ${error.message}`);
      
      this.logger.log(`Match created: ${data.id}`);
      return data;
    } catch (error) {
      this.logger.error('Error creating match:', error);
      throw error;
    }
  }

  private async ensureTeamExists(teamId: string, teamName: string): Promise<string> {
    try {
      // Verificar se o time existe
      const { data: existingTeam, error: fetchError } = await supabase
        .from('game_teams')
        .select('id')
        .eq('id', teamId)
        .single();

      if (existingTeam) {
        return existingTeam.id;
      }

      // Se não existe, criar um time básico
      this.logger.log(`Creating team automatically: ${teamName} (${teamId})`);
      
      const { data: newTeam, error: createError } = await supabase
        .from('game_teams')
        .insert({
          id: teamId, // Usar o ID fornecido
          name: teamName,
          slug: `auto-${Date.now()}`,
          owner_id: '22fa9e4b-858e-49b5-b80c-1390f9665ac9', // Usar o usuário padrão
          team_type: 'auto_created',
          colors: {
            primary: '#666666',
            secondary: '#ffffff'
          },
          logo_url: null,
          stadium_name: `${teamName} Stadium`,
          stadium_capacity: 25000,
          budget: 1000000,
          reputation: 50,
          fan_base: 1000,
          game_stats: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        this.logger.error(`Error creating team ${teamName}:`, createError);
        throw new Error(`Error creating team: ${createError.message}`);
      }

      this.logger.log(`Team created automatically: ${newTeam.name} (${newTeam.id})`);
      return newTeam.id;
    } catch (error) {
      this.logger.error(`Error ensuring team exists: ${teamName}`, error);
      throw error;
    }
  }

  async simulateMatch(matchId: string) {
    try {
      // Buscar a partida
      const { data: match, error: matchError } = await supabase
        .from('game_matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw new Error(`Error fetching match: ${matchError.message}`);

      // Buscar os times
      const homeTeam = await this.getTeamById(match.home_team_id);
      const awayTeam = await this.getTeamById(match.away_team_id);

      // Simular a partida
      const simulation = this.simulateMatchResult(homeTeam, awayTeam);

      // Preparar dados de atualização (sem finished_at para evitar erro)
      const updateData = {
        home_score: simulation.homeScore,
        away_score: simulation.awayScore,
        status: 'finished',
        highlights: simulation.highlights,
        stats: simulation.stats,
        updated_at: new Date().toISOString()
      };

      // Atualizar a partida com o resultado
      const { data: updatedMatch, error: updateError } = await supabase
        .from('game_matches')
        .update(updateData)
        .eq('id', matchId)
        .select()
        .single();

      if (updateError) throw new Error(`Error updating match: ${updateError.message}`);

      // Atualizar reputação e orçamento dos times
      await this.updateTeamAfterMatch(homeTeam.id, simulation.homeScore, simulation.awayScore);
      await this.updateTeamAfterMatch(awayTeam.id, simulation.awayScore, simulation.homeScore);

      this.logger.log(`Match simulated: ${matchId} - ${simulation.homeScore}x${simulation.awayScore}`);
      return updatedMatch;
    } catch (error) {
      this.logger.error('Error simulating match:', error);
      throw error;
    }
  }

  private simulateMatchResult(homeTeam: any, awayTeam: any) {
    // Fatores que influenciam o resultado
    const homeAdvantage = 1.2; // Vantagem de jogar em casa
    const homeReputation = homeTeam.reputation || 50;
    const awayReputation = awayTeam.reputation || 50;
    
    // Calcular força base dos times
    const homeStrength = (homeReputation * homeAdvantage) + Math.random() * 20;
    const awayStrength = awayReputation + Math.random() * 20;

    // Simular gols baseado na diferença de força
    const strengthDiff = homeStrength - awayStrength;
    const homeGoals = Math.max(0, Math.floor((strengthDiff + 30) / 15) + Math.floor(Math.random() * 3));
    const awayGoals = Math.max(0, Math.floor((30 - strengthDiff) / 15) + Math.floor(Math.random() * 3));

    // Gerar estatísticas
    const possession = 50 + (strengthDiff / 2);
    const homeShots = Math.floor(homeGoals * 3 + Math.random() * 8);
    const awayShots = Math.floor(awayGoals * 3 + Math.random() * 8);
    const homeShotsOnTarget = Math.floor(homeShots * 0.6);
    const awayShotsOnTarget = Math.floor(awayShots * 0.6);

    // Gerar highlights
    const highlights = this.generateHighlights(homeTeam.name, awayTeam.name, homeGoals, awayGoals);

    return {
      homeScore: homeGoals,
      awayScore: awayGoals,
      highlights,
      stats: {
        possession: { home: Math.max(30, Math.min(70, possession)), away: Math.max(30, Math.min(70, 100 - possession)) },
        shots: { home: homeShots, away: awayShots },
        shots_on_target: { home: homeShotsOnTarget, away: awayShotsOnTarget },
        corners: { home: Math.floor(homeShots * 0.3), away: Math.floor(awayShots * 0.3) },
        fouls: { home: Math.floor(Math.random() * 15) + 5, away: Math.floor(Math.random() * 15) + 5 },
        yellow_cards: { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) },
        red_cards: { home: Math.floor(Math.random() * 2), away: Math.floor(Math.random() * 2) }
      }
    };
  }

  private generateHighlights(homeTeamName: string, awayTeamName: string, homeGoals: number, awayGoals: number) {
    const highlights = [];
    const players = ['João Silva', 'Pedro Santos', 'Carlos Oliveira', 'Miguel Costa', 'Lucas Pereira'];
    
    let homeGoalCount = 0;
    let awayGoalCount = 0;
    
    // Simular gols em momentos aleatórios
    for (let minute = 1; minute <= 90; minute += Math.floor(Math.random() * 10) + 5) {
      if (minute > 90) break;
      
      if (homeGoalCount < homeGoals && Math.random() < 0.3) {
        const player = players[Math.floor(Math.random() * players.length)];
        highlights.push(`⚽ ${minute}' - Gol do ${player} (${homeTeamName}) ${homeGoalCount + 1}-${awayGoalCount}`);
        homeGoalCount++;
      }
      
      if (awayGoalCount < awayGoals && Math.random() < 0.25) {
        const player = players[Math.floor(Math.random() * players.length)];
        highlights.push(`⚽ ${minute}' - Gol do ${player} (${awayTeamName}) ${homeGoalCount}-${awayGoalCount + 1}`);
        awayGoalCount++;
      }
    }
    
    return highlights;
  }

  private async updateTeamAfterMatch(teamId: string, goalsFor: number, goalsAgainst: number) {
    try {
      const team = await this.getTeamById(teamId);
      
      // Calcular mudanças na reputação
      let reputationChange = 0;
      if (goalsFor > goalsAgainst) {
        reputationChange = 5; // Vitória
      } else if (goalsFor === goalsAgainst) {
        reputationChange = 2; // Empate
      } else {
        reputationChange = -3; // Derrota
      }
      
      // Calcular receita do jogo
      const baseRevenue = 50000;
      const attendance = Math.floor((team.stadium_capacity || 10000) * 0.7);
      const ticketPrice = 50;
      const matchRevenue = baseRevenue + (attendance * ticketPrice);
      
      // Atualizar time
      const newReputation = Math.max(0, Math.min(100, (team.reputation || 50) + reputationChange));
      const newBudget = (team.budget || 0) + matchRevenue;
      
      const { error } = await supabase
        .from('game_teams')
        .update({
          reputation: newReputation,
          budget: newBudget
        })
        .eq('id', teamId);

      if (error) throw new Error(`Error updating team after match: ${error.message}`);
      
      this.logger.log(`Team ${teamId} updated: reputation +${reputationChange}, revenue +${matchRevenue}`);
    } catch (error) {
      this.logger.error('Error updating team after match:', error);
      throw error;
    }
  }

  private async createInitialPlayers(teamId: string) {
    try {
      this.logger.log(`🎮 Creating initial players for team: ${teamId}`);
      
      // Definir as posições e quantidades
      const playerPositions = [
        { position: 'Goleiro', count: 3 },
        { position: 'Zagueiro', count: 4 },
        { position: 'Lateral Esquerdo', count: 2 },
        { position: 'Lateral Direito', count: 2 },
        { position: 'Atacante', count: 2 },
        { position: 'Centroavante', count: 2 },
        { position: 'Meia Ofensivo', count: 2 },
        { position: 'Volante', count: 2 },
        { position: 'Meia Central', count: 2 },
        { position: 'Ponta Esquerda', count: 1 },
        { position: 'Ponta Direita', count: 1 }
      ];

      this.logger.log(`📋 Will create ${playerPositions.reduce((sum, pos) => sum + pos.count, 0)} players`);

      const players = [];
      let playerNumber = 1;

      for (const pos of playerPositions) {
        this.logger.log(`⚽ Creating ${pos.count} ${pos.position} players...`);
        for (let i = 0; i < pos.count; i++) {
          const player = this.generatePlayer(teamId, pos.position, playerNumber);
          players.push(player);
          playerNumber++;
        }
      }

      this.logger.log(`📝 Generated ${players.length} player objects, attempting to insert...`);

      // Inserir todos os jogadores
      const { data, error } = await supabase
        .from('youth_players')
        .insert(players)
        .select();

      if (error) {
        this.logger.error(`❌ Error creating players: ${error.message}`);
        this.logger.error(`📝 Error code: ${error.code}`);
        this.logger.error(`📝 Error details: ${error.details}`);
        throw new Error(`Error creating players: ${error.message}`);
      }

      this.logger.log(`✅ Successfully created ${data?.length || players.length} players for team: ${teamId}`);
      
      // Log dos primeiros jogadores criados
      if (data && data.length > 0) {
        this.logger.log(`👥 First player created: ${data[0].name} - ${data[0].position}`);
      }
      
    } catch (error) {
      this.logger.error('💥 Error creating initial players:', error);
      this.logger.error('📝 Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  private generatePlayer(teamId: string, position: string, playerNumber: number) {
    const names = [
      'João Silva', 'Pedro Santos', 'Carlos Oliveira', 'Miguel Costa', 'Lucas Pereira',
      'Gabriel Ferreira', 'Rafael Almeida', 'Bruno Rodrigues', 'Thiago Lima', 'André Souza',
      'Daniel Martins', 'Ricardo Barbosa', 'Fernando Cardoso', 'Marcos Teixeira', 'Paulo Gomes',
      'Roberto Carvalho', 'Eduardo Mendes', 'Alexandre Santos', 'Felipe Costa', 'Diego Silva',
      'Matheus Oliveira', 'Vinícius Pereira', 'Guilherme Santos'
    ];

    const name = names[playerNumber - 1] || `Jogador ${playerNumber}`;
    
    // Gerar idade entre 18 e 35 anos
    const age = Math.floor(Math.random() * 18) + 18;
    const birthYear = new Date().getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

    // Gerar atributos baseados na posição
    const attributes = this.generatePlayerAttributes(position);
    
    // Gerar potencial baseado nos atributos atuais
    const potential = this.generatePlayerPotential(attributes);

    return {
      team_id: teamId,
      name: name,
      position: position,
      date_of_birth: birthDate.toISOString().split('T')[0],
      nationality: 'Brasil',
      attributes: attributes,
      potential: potential,
      status: 'contracted',
      contract_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
  }

  private generatePlayerAttributes(position: string) {
    const baseAttributes = {
      pace: Math.floor(Math.random() * 20) + 60,
      shooting: Math.floor(Math.random() * 20) + 60,
      passing: Math.floor(Math.random() * 20) + 60,
      dribbling: Math.floor(Math.random() * 20) + 60,
      defending: Math.floor(Math.random() * 20) + 60,
      physical: Math.floor(Math.random() * 20) + 60
    };

    // Ajustar atributos baseados na posição
    switch (position) {
      case 'Goleiro':
        return {
          ...baseAttributes,
          defending: Math.floor(Math.random() * 15) + 75,
          physical: Math.floor(Math.random() * 15) + 70,
          pace: Math.floor(Math.random() * 10) + 50,
          shooting: Math.floor(Math.random() * 10) + 30
        };
      
      case 'Zagueiro':
        return {
          ...baseAttributes,
          defending: Math.floor(Math.random() * 15) + 70,
          physical: Math.floor(Math.random() * 15) + 70,
          pace: Math.floor(Math.random() * 15) + 55
        };
      
      case 'Lateral Esquerdo':
      case 'Lateral Direito':
        return {
          ...baseAttributes,
          pace: Math.floor(Math.random() * 15) + 70,
          defending: Math.floor(Math.random() * 15) + 65,
          passing: Math.floor(Math.random() * 15) + 65
        };
      
      case 'Volante':
        return {
          ...baseAttributes,
          defending: Math.floor(Math.random() * 15) + 70,
          physical: Math.floor(Math.random() * 15) + 70,
          passing: Math.floor(Math.random() * 15) + 65
        };
      
      case 'Meia Central':
        return {
          ...baseAttributes,
          passing: Math.floor(Math.random() * 15) + 70,
          dribbling: Math.floor(Math.random() * 15) + 65,
          shooting: Math.floor(Math.random() * 15) + 60
        };
      
      case 'Meia Ofensivo':
        return {
          ...baseAttributes,
          passing: Math.floor(Math.random() * 15) + 70,
          dribbling: Math.floor(Math.random() * 15) + 70,
          shooting: Math.floor(Math.random() * 15) + 65
        };
      
      case 'Ponta Esquerda':
      case 'Ponta Direita':
        return {
          ...baseAttributes,
          pace: Math.floor(Math.random() * 15) + 75,
          dribbling: Math.floor(Math.random() * 15) + 70,
          shooting: Math.floor(Math.random() * 15) + 65
        };
      
      case 'Atacante':
        return {
          ...baseAttributes,
          shooting: Math.floor(Math.random() * 15) + 70,
          pace: Math.floor(Math.random() * 15) + 70,
          dribbling: Math.floor(Math.random() * 15) + 65
        };
      
      case 'Centroavante':
        return {
          ...baseAttributes,
          shooting: Math.floor(Math.random() * 15) + 75,
          physical: Math.floor(Math.random() * 15) + 70,
          pace: Math.floor(Math.random() * 15) + 65
        };
      
      default:
        return baseAttributes;
    }
  }

  private generatePlayerPotential(attributes: any) {
    // O potencial é baseado nos atributos atuais com uma variação
    return {
      pace: Math.min(99, attributes.pace + Math.floor(Math.random() * 10) - 5),
      shooting: Math.min(99, attributes.shooting + Math.floor(Math.random() * 10) - 5),
      passing: Math.min(99, attributes.passing + Math.floor(Math.random() * 10) - 5),
      dribbling: Math.min(99, attributes.dribbling + Math.floor(Math.random() * 10) - 5),
      defending: Math.min(99, attributes.defending + Math.floor(Math.random() * 10) - 5),
      physical: Math.min(99, attributes.physical + Math.floor(Math.random() * 10) - 5)
    };
  }
} 