import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../config/supabase.config';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  // Método genérico para queries
  async query(sql: string, params: any[] = []) {
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        query: sql,
        params
      });

      if (error) {
        this.logger.error('Supabase query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Query execution failed:', error);
      throw error;
    }
  }

  // Métodos específicos para entidades
  async createGameTeam(teamData: any) {
    const { data, error } = await supabase
      .from('game_teams')
      .insert(teamData)
      .select()
      .single();

    if (error) throw new Error(`Error creating team: ${error.message}`);
    return data;
  }

  async getGameTeams(userId: string) {
    const { data, error } = await supabase
      .from('game_teams')
      .select(`
        *,
        youth_academies (*)
      `)
      .eq('owner_id', userId)
      .eq('team_type', 'user_created');

    if (error) throw new Error(`Error fetching teams: ${error.message}`);
    // Garantir que sempre retorne um array
    return data || [];
  }

  async createYouthPlayer(playerData: any) {
    const { data, error } = await supabase
      .from('youth_players')
      .insert(playerData)
      .select()
      .single();

    if (error) throw new Error(`Error creating youth player: ${error.message}`);
    return data;
  }

  async scheduleYouthTryout(tryoutData: any) {
    const { data, error } = await supabase
      .from('youth_tryouts')
      .insert(tryoutData)
      .select()
      .single();

    if (error) throw new Error(`Error scheduling tryout: ${error.message}`);
    return data;
  }

  async getYouthCategories() {
    const { data, error } = await supabase
      .from('youth_categories')
      .select('*')
      .eq('is_active', true);

    if (error) throw new Error(`Error fetching categories: ${error.message}`);
    return data;
  }

  async getYouthAcademy(teamId: string) {
    const { data, error } = await supabase
      .from('youth_academies')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (error) throw new Error(`Error fetching academy: ${error.message}`);
    return data;
  }

  async updateYouthAcademy(teamId: string, updateData: any) {
    const { data, error } = await supabase
      .from('youth_academies')
      .update(updateData)
      .eq('team_id', teamId)
      .select()
      .single();

    if (error) throw new Error(`Error updating academy: ${error.message}`);
    return data;
  }

  async getYouthPlayers(teamId?: string) {
    let query = supabase
      .from('youth_players')
      .select(`
        *,
        youth_categories (*)
      `);

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error fetching youth players: ${error.message}`);
    return data;
  }

  async getScheduledTryouts(teamId?: string) {
    let query = supabase
      .from('youth_tryouts')
      .select(`
        *,
        youth_categories (*)
      `)
      .eq('status', 'scheduled');

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error fetching tryouts: ${error.message}`);
    return data;
  }
} 