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
    const { teamId, lineup, ...rest } = payload;
    // Normalizar lineup: aceitar array de objetos {slotId, playerId} ou array simples
    let normalizedLineup: any[] = [];
    if (Array.isArray(lineup)) {
      normalizedLineup = lineup.map((row: any) => {
        if (row && typeof row === 'object') {
          return { slotId: row.slotId, playerId: row.playerId };
        }
        return row;
      });
    }
    const { data, error } = await supabase
      .from('game_tactics')
      .upsert({ team_id: teamId, ...rest, lineup: normalizedLineup })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { success: true, data };
  }
}


