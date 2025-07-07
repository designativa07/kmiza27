import { Match, KnockoutTie } from '@/types/match';

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
 * Detectar se uma rodada específica é mata-mata baseada no nome da rodada e tipo da competição
 */
export const isRoundKnockout = (roundName: string, competitionType: string): boolean => {
  // Para competições de pontos corridos puros, nunca é mata-mata
  if (competitionType === 'pontos_corridos') {
    return false;
  }
  
  // Para competições mata-mata puras, sempre é mata-mata
  if (competitionType === 'mata_mata') {
    return true;
  }
  
  // Para competições mistas (grupos + mata-mata), verificar pelo nome da rodada
  if (competitionType === 'grupos_e_mata_mata' || competitionType === 'copa' || competitionType === 'serie') {
    return isKnockoutPhase(roundName);
  }
  
  return false;
};

/**
 * Detectar se uma competição é do tipo mata-mata pelo seu tipo
 */
export const isKnockoutCompetition = (competitionType: string): boolean => {
  return competitionType === 'mata_mata' || 
         competitionType === 'grupos_e_mata_mata' || 
         competitionType === 'copa' ||
         competitionType === 'torneio' || // Adicionado para suportar "Torneio (Mata-mata)"
         competitionType === 'serie';
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

/**
 * Criar confrontos de mata-mata (KnockoutTies) a partir de uma lista de partidas.
 * Agrupa partidas de ida e volta em um único confronto e calcula o placar agregado.
 */
export const createKnockoutTies = (matches: Match[]): KnockoutTie[] => {
  const tiesMap = new Map<string, KnockoutTie>();

  matches.forEach(match => {
    // Aceitar partidas mesmo sem fase definida, usar "Mata-mata" como padrão
    const phase = match.phase || 'Mata-mata';
    
    // Verificar se a partida tem tie_id ou leg definidos
    const tieId = (match as any).tie_id || (match as any).leg_id;
    const leg = (match as any).leg;
    
    let confrontoId: string;
    
    if (tieId) {
      // Se tem tie_id, usar ele como base
      confrontoId = `${phase}-${tieId}`;
    } else {
      // Gerar um ID de confronto baseado nos times e fase, para agrupar jogos de ida e volta
      const teamPairKey = [match.home_team.id, match.away_team.id].sort().join('-');
      confrontoId = `${phase}-${teamPairKey}`;
    }

    let tie = tiesMap.get(confrontoId);

    if (!tie) {
      let tieStatus: KnockoutTie['status'] = 'SCHEDULED'; // Default to SCHEDULED
      const upperCaseMatchStatus = match.status.toUpperCase();
      if (upperCaseMatchStatus === 'FINISHED' || upperCaseMatchStatus === 'IN_PROGRESS') {
        tieStatus = upperCaseMatchStatus as KnockoutTie['status'];
      }

      tie = {
        id: confrontoId,
        phase: phase,
        home_team: match.home_team,
        away_team: match.away_team,
        leg1: match,
        status: tieStatus,
      };
      tiesMap.set(confrontoId, tie as KnockoutTie);
    } else {
      // Se já existe um confronto, esta é a partida de volta
      tie.leg2 = match;

      // Atualiza o status do confronto baseado na partida de volta
      const upperCaseMatchStatus = match.status.toUpperCase();
      if (upperCaseMatchStatus === 'FINISHED' || upperCaseMatchStatus === 'IN_PROGRESS') {
          tie.status = upperCaseMatchStatus as KnockoutTie['status'];
      }
    }
  });

  // Calcular placares agregados e determinar o vencedor
  tiesMap.forEach(tie => {
    let homeAggregate = tie.leg1.home_score || 0;
    let awayAggregate = tie.leg1.away_score || 0;

    if (tie.leg2) {
      homeAggregate += tie.leg2.home_score || 0;
      awayAggregate += tie.leg2.away_score || 0;
    }

    tie.aggregate_home_score = homeAggregate;
    tie.aggregate_away_score = awayAggregate;

    if (tie.status === 'FINISHED') {
      if (homeAggregate > awayAggregate) {
        tie.winner_team = tie.home_team;
      } else if (awayAggregate > homeAggregate) {
        tie.winner_team = tie.away_team;
      } else {
        // Caso de empate no agregado, verificar regras de desempate se houver
        // Por simplicidade, se for mata-mata e tiver penaltis, quem venceu o segundo jogo por penaltis (se for o caso)
        if (tie.leg2 && (tie.leg2.home_score_penalties !== undefined || tie.leg2.away_score_penalties !== undefined)) {
          const homePenalties = tie.leg2.home_score_penalties || 0;
          const awayPenalties = tie.leg2.away_score_penalties || 0;
          if (homePenalties > awayPenalties) {
            tie.winner_team = tie.home_team;
          } else if (awayPenalties > homePenalties) {
            tie.winner_team = tie.away_team;
          }
        }
      }
    }
  });

  return Array.from(tiesMap.values());
}; 