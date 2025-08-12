import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';
import { PlayerDevelopmentService } from '../player-development/player-development.service';

@Injectable()
export class YouthAcademyService {
  async setTraining(payload: { playerId: string; focus: string; intensity?: 'low'|'normal'|'high'; inAcademy?: boolean }) {
    const updates: any = {
      training_focus: payload.focus,
      training_intensity: payload.intensity || 'normal',
    };
    if (typeof payload.inAcademy === 'boolean') updates.is_in_academy = payload.inAcademy;
    const { error } = await supabase.from('game_players').update(updates).eq('id', payload.playerId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async applyWeek(teamId: string) {
    // Buscar jogadores do time em academia
    const { data: players, error } = await supabase
      .from('game_players')
      .select(`id, team_id, age, morale, potential, current_ability, training_focus, training_intensity,
               passing, shooting, dribbling, crossing, finishing,
               speed, stamina, strength, jumping,
               concentration, creativity, vision, leadership,
               defending, tackling, heading, goalkeeping, injury_until`)
      .eq('team_id', teamId)
      .eq('is_in_academy', true);

    if (error) throw new Error(error.message);

    // Aplicar efeitos de investimentos: bônus de treino e redução de lesão
    const { data: inv } = await supabase
      .from('game_investments')
      .select('item_id')
      .eq('team_id', teamId);
    const has = (key: string) => (inv || []).some((i: any) => i.item_id === key);
    const trainingBonus = (has('training_center') ? 0.1 : 0) + (has('youth_academy') ? 0.1 : 0);
    const injuryReduction = has('medical_center') ? 0.2 : 0;

    const updates: any[] = [];
    const logs: any[] = [];
    const now = new Date();
    const week = Number(`${now.getUTCFullYear()}${String(now.getUTCMonth()+1).padStart(2,'0')}`);

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const focusMap: Record<string, { primary: string; secondary: string[] }> = {
      PAC: { primary: 'speed', secondary: ['stamina'] },
      SHO: { primary: 'shooting', secondary: ['finishing'] },
      PAS: { primary: 'passing', secondary: ['vision'] },
      DRI: { primary: 'dribbling', secondary: ['creativity'] },
      DEF: { primary: 'defending', secondary: ['tackling'] },
      PHY: { primary: 'strength', secondary: ['jumping', 'stamina'] },
      GK:  { primary: 'goalkeeping', secondary: ['concentration'] },
    };

    for (const p of players || []) {
      const potentialFactor = clamp(((p.potential || 0) - (p.current_ability || 0)) / 20, 0.4, 1.6);
      const age = p.age || 24;
      const ageFactor = age <= 21 ? 1.3 : age <= 27 ? 1.0 : age <= 32 ? 0.7 : 0.4;
      const intensity = (p.training_intensity as string) || 'normal';
      const intensityFactor = intensity === 'high' ? 1.3 : intensity === 'low' ? 0.7 : 1.0;
      const morale = p.morale || 60;
      const moraleFactor = 0.8 + morale / 250; // 0.8 - 1.2
      const points = 2.0 * potentialFactor * ageFactor * intensityFactor * moraleFactor * (1 + trainingBonus);

      const focus = (p.training_focus as string) || 'PAS';
      const mapping = focusMap[focus] || focusMap['PAS'];

      const primaryGain = points * 0.8;
      const secondaryGain = (points * 0.2) / Math.max(1, mapping.secondary.length);

      const delta: Record<string, number> = {};
      const primaryVal = clamp((p[mapping.primary] || 0) + primaryGain, 1, 99);
      delta[mapping.primary] = primaryVal - (p[mapping.primary] || 0);

      for (const sec of mapping.secondary) {
        const newVal = clamp((p[sec] || 0) + secondaryGain, 1, 99);
        delta[sec] = newVal - (p[sec] || 0);
      }

      // Risco de lesão leve em intensidade alta
      let injuryNote: string | undefined;
      if ((p.training_intensity as string) === 'high') {
        const baseRisk = 0.02; // 2%
        const risk = Math.max(0, baseRisk * (1 - injuryReduction));
        if (Math.random() < risk) {
          const days = 7 + Math.floor(Math.random() * 8); // 7-14 dias
          const injuryUntil = new Date();
          injuryUntil.setDate(injuryUntil.getDate() + days);
          updates.push({ id: p.id, injury_until: injuryUntil.toISOString().slice(0, 10) });
          injuryNote = `lesao_${days}d`;
          // Notícia
          await supabase.from('game_news').insert({ team_id: teamId, type: 'injury', title: `Lesão no treino`, message: `Jogador ${p.id} sofreu lesão leve (${days} dias).` });
        }
      }

      // Montar update por jogador
      const updateRow: any = { id: p.id };
      Object.keys(delta).forEach((k) => (updateRow[k] = (p[k] || 0) + delta[k]));
      updates.push(updateRow);

      logs.push({
        team_id: teamId,
        player_id: p.id,
        week,
        focus,
        intensity,
        delta_attributes: delta,
        notes: injuryNote ? `weekly_training;${injuryNote}` : 'weekly_training',
      });
    }

    if (updates.length > 0) {
      // Atualização por lotes (upsert pela PK id)
      const { error: upErr } = await supabase.from('game_players').upsert(updates, { onConflict: 'id' });
      if (upErr) throw new Error(upErr.message);
      await supabase.from('game_academy_logs').insert(logs);
    }

    // Notícia da semana de treino
    await supabase.from('game_news').insert({ team_id: teamId, type: 'training', title: 'Semana de treino aplicada', message: `${updates.length} jogadores receberam evolução.` });

    return { success: true, processed: true, count: updates.length };
  }

  async getLogs(teamId: string) {
    const { data, error } = await supabase.from('game_academy_logs').select('*').eq('team_id', teamId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getPlayersInAcademy(teamId: string) {
    const { data, error } = await supabase
      .from('game_players')
      .select('id,name,position,age,morale,potential,current_ability,training_focus,training_intensity,is_in_academy,passing,shooting,dribbling,defending,speed,stamina,strength')
      .eq('team_id', teamId)
      .eq('is_in_academy', true);
    if (error) throw new Error(error.message);
    return data || [];
  }
}


