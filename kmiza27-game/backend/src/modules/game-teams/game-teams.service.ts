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
        .select(`
          *,
          youth_academies (*),
          youth_players (*)
        `)
        .eq('id', teamId)
        .single();

      if (error) throw new Error(`Error fetching team: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error fetching team by ID:', error);
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
} 