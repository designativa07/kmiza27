/**
 * Utilitários para competições e mata-mata
 * Padroniza a lógica de identificação de fases e tipos de competição
 */

export interface Competition {
  id: number;
  name: string;
  slug: string;
  type: string;
  season: string;
  has_groups?: boolean;
}

export interface Match {
  id: number;
  phase?: string;
  group_name?: string;
  home_team: {
    id: number;
    name: string;
    logo_url: string;
  };
  away_team: {
    id: number;
    name: string;
    logo_url: string;
  };
  home_score?: number;
  away_score?: number;
  status: string;
  match_date: string;
  round_number?: number;
  stadium?: {
    name: string;
    city?: string;
  };
}

/**
 * Detectar se uma fase é de mata-mata
 */
export const isKnockoutPhase = (phase: string): boolean => {
  const knockoutPhases = [
    'Oitavas de Final', 'Oitavas', 
    'Quartas de Final', 'Quartas',
    'Semifinal', 'Semifinais',
    'Final', 'Disputa do 3º lugar',
    'Terceira Fase', 'Primeira Fase',
    'Segunda Fase', 'Quarta Fase',
    'Fase Preliminar', 'Playoffs'
  ];
  return knockoutPhases.some(p => phase.toLowerCase().includes(p.toLowerCase()));
};

/**
 * Detectar se uma competição é do tipo mata-mata pelo seu tipo
 */
export const isKnockoutCompetition = (competitionType: string): boolean => {
  return competitionType === 'mata_mata' || 
         competitionType === 'grupos_e_mata_mata' || 
         competitionType === 'copa';
};

/**
 * Filtrar partidas de mata-mata de uma competição
 */
export const getKnockoutMatches = (matches: Match[], competition?: Competition): Match[] => {
  return matches.filter(match => {
    // Para competições mata-mata puras, mostrar todas as partidas com fase definida
    if (competition && isKnockoutCompetition(competition.type)) {
      return match.phase && isKnockoutPhase(match.phase);
    }
    // Para outras competições, filtrar apenas por fase específica
    return match.phase && isKnockoutPhase(match.phase);
  });
};

/**
 * Verificar se deve mostrar o chaveamento
 */
export const shouldShowBracket = (matches: Match[], competition?: Competition): boolean => {
  const knockoutMatches = getKnockoutMatches(matches, competition);
  return knockoutMatches.length > 0 && 
    (competition ? (isKnockoutCompetition(competition.type) || knockoutMatches.length > 0) : true);
};

/**
 * Obter partidas agrupadas por fase para o chaveamento
 */
export const getMatchesByPhase = (matches: Match[]): Record<string, Match[]> => {
  return matches.reduce((acc, match) => {
    const phase = match.phase || 'Outras';
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(match);
    return acc;
  }, {} as Record<string, Match[]>);
};

/**
 * Mapeamento da ordem das fases para organização do chaveamento
 */
export const phaseOrder: Record<string, number> = {
  'Primeira Fase': 1,
  'Segunda Fase': 2,
  'Terceira Fase': 3,
  'Quarta Fase': 4,
  'Oitavas de Final': 5,
  'Oitavas': 5,
  'Quartas de Final': 6,
  'Quartas': 6,
  'Semifinal': 7,
  'Semifinais': 7,
  'Final': 8,
  'Disputa do 3º lugar': 8
};

/**
 * Ordenar fases pela ordem lógica
 */
export const getOrderedPhases = (phases: string[]): string[] => {
  return phases.sort((a, b) => {
    const orderA = phaseOrder[a] || 99;
    const orderB = phaseOrder[b] || 99;
    return orderA - orderB;
  });
}; 