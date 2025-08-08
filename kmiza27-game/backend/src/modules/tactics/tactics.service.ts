import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class TacticsService {
  async get(teamId: string) {
    const { data } = await supabase.from('game_tactics').select('*').eq('team_id', teamId).single();
    if (data) return data;
    return { team_id: teamId, formation: '4-4-2', style: 'equilibrado', pressing: 'média', width: 'normal', tempo: 'normal', roles: {}, lineup: [] };
  }

  async save(payload: any) {
    const { teamId, ...rest } = payload;
    const { data, error } = await supabase.from('game_tactics').upsert({ team_id: teamId, ...rest }).select().single();
    if (error) throw new Error(error.message);
    return { success: true, data };
  }
}


