// src/lib/player-utils.ts

import { PlayerCardData } from "@/types/player";

const getNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const transformPlayerData = (player: any): PlayerCardData | null => {
  if (!player) return null;

  const rawAttributes = player.attributes || player;

  // Construir um objeto limpo com base na interface PlayerCardData
  const transformed: PlayerCardData = {
    id: player.id,
    name: player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim(),
    position: player.position || 'N/A',
    age: getNumber(player.age),
    overall: getNumber(player.overall),
    potential: getNumber(player.potential),
    attributes: {
      PAC: getNumber(rawAttributes.pace),
      FIN: getNumber(rawAttributes.shooting),
      PAS: getNumber(rawAttributes.passing),
      DRI: getNumber(rawAttributes.dribbling),
      DEF: getNumber(rawAttributes.defending),
      FIS: getNumber(rawAttributes.physical),
      GOL: getNumber(rawAttributes.goalkeeping),
    },
    is_in_academy: player.is_in_academy || false,
    morale: getNumber(player.morale),
    fitness: getNumber(player.fitness),
    form: getNumber(player.form),
    fatigue: getNumber(player.fatigue),
    injury_severity: getNumber(player.injury_severity),
    salary: getNumber(player.salary),
    market_value: getNumber(player.market_value),
    training_focus: player.training_focus,
    training_intensity: player.training_intensity,
    personality: player.personality,
    games_played: getNumber(player.games_played),
    goals_scored: getNumber(player.goals_scored),
    assists: getNumber(player.assists),
    average_rating: getNumber(player.average_rating),
  };

  return transformed;
};
