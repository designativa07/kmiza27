'use client';

import { useState, useEffect } from 'react';
import { TournamentBracket } from '@/components/TournamentBracket';
import { Match, KnockoutTie } from '@/types/match';
import { getApiUrl } from '@/lib/config';

interface Competition {
  id: number;
  name: string;
  slug: string;
  type: string;
  season: string;
}

// Detectar se é fase de mata-mata
const isKnockoutPhase = (phase: string) => {
  const knockoutPhases = [
    'Oitavas de Final', 'Oitavas', 
    'Quartas de Final', 'Quartas',
    'Semifinal', 'Semifinais',
    'Final', 'Disputa do 3º lugar',
    'Terceira Fase', 'Primeira Fase'
  ];
  return knockoutPhases.some(p => phase.toLowerCase().includes(p.toLowerCase()));
};

// Detectar competições mata-mata pelo tipo da competição
const isKnockoutCompetition = (competitionType: string) => {
  return competitionType === 'mata_mata' || 
         competitionType === 'grupos_e_mata_mata' || 
         competitionType === 'copa';
};

// Função para agrupar partidas em confrontos de ida e volta
const groupMatchesIntoTies = (matches: Match[]): KnockoutTie[] => {
  const tiesMap: Record<string, KnockoutTie> = {};

  // Criar um mapa de partidas por fase e por combinação de times (ordenados para ser consistente)
  const matchesByPhaseAndTeams: Record<string, Match[]> = {};

  matches.forEach(match => {
    if (!match.phase) return; // Ignorar partidas sem fase definida para agrupamento

    // Crie uma chave consistente para o confronto, independente da ordem home/away
    const team1Id = Math.min(match.home_team.id, match.away_team.id);
    const team2Id = Math.max(match.home_team.id, match.away_team.id);
    const tieKey = `${match.phase}-${team1Id}-${team2Id}`;

    if (!matchesByPhaseAndTeams[tieKey]) {
      matchesByPhaseAndTeams[tieKey] = [];
    }
    matchesByPhaseAndTeams[tieKey].push(match);
  });

  for (const tieKey in matchesByPhaseAndTeams) {
    const tieMatches = matchesByPhaseAndTeams[tieKey].sort((a, b) => 
      new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    ); // Ordenar por data para garantir ida e volta

    const leg1 = tieMatches[0];
    const leg2 = tieMatches.length > 1 ? tieMatches[1] : undefined;

    let aggregate_home_score = leg1.home_score || 0;
    let aggregate_away_score = leg1.away_score || 0;
    let status: KnockoutTie['status'] = leg1.status as KnockoutTie['status'];
    let winner_team = undefined;

    if (leg2) {
      aggregate_home_score += leg2.home_team.id === leg1.home_team.id ? (leg2.home_score || 0) : (leg2.away_score || 0);
      aggregate_away_score += leg2.home_team.id === leg1.away_team.id ? (leg2.home_score || 0) : (leg2.away_score || 0);
      
      // Considerar pênaltis apenas se ambos os jogos estiverem finalizados e os placares agregados forem iguais
      if (leg1.status === 'FINISHED' && leg2.status === 'FINISHED' && aggregate_home_score === aggregate_away_score) {
        // Adicionar placares de pênaltis
        aggregate_home_score += (leg1.home_score_penalties || 0) + (leg2.home_score_penalties || 0);
        aggregate_away_score += (leg1.away_score_penalties || 0) + (leg2.away_score_penalties || 0);
      }

      if (leg2.status === 'FINISHED') {
        status = 'FINISHED';
      } else if (leg1.status === 'IN_PROGRESS' || leg2.status === 'IN_PROGRESS') {
        status = 'IN_PROGRESS';
      }

      // Determinar o vencedor do confronto
      if (status === 'FINISHED') {
        if (aggregate_home_score > aggregate_away_score) {
          winner_team = leg1.home_team;
        } else if (aggregate_away_score > aggregate_home_score) {
          winner_team = leg1.away_team;
        }
      }

    } else if (status === 'FINISHED' && aggregate_home_score === aggregate_away_score) {
      // Se for apenas um jogo e estiver empatado, verificar pênaltis do primeiro jogo
      if (leg1.home_score_penalties !== undefined && leg1.away_score_penalties !== undefined) {
        if (leg1.home_score_penalties > leg1.away_score_penalties) {
          winner_team = leg1.home_team;
        } else if (leg1.away_score_penalties > leg1.home_score_penalties) {
          winner_team = leg1.away_team;
        }
      }
    }

    // Definir o time mandante e visitante do confronto com base na primeira partida
    const homeTeamForTie = leg1.home_team;
    const awayTeamForTie = leg1.away_team;

    tiesMap[tieKey] = {
      id: tieKey,
      phase: leg1.phase!,
      home_team: homeTeamForTie,
      away_team: awayTeamForTie,
      leg1: leg1,
      leg2: leg2,
      aggregate_home_score: aggregate_home_score,
      aggregate_away_score: aggregate_away_score,
      winner_team: winner_team,
      status: status,
    };
  }

  // Converter o mapa de confrontos de volta para um array
  return Object.values(tiesMap);
};

export default function ChaveamentoPage({ params }: { params: { competitionSlug: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const API_URL = getApiUrl();

        // 1. Buscar informações da competição
        const competitionResponse = await fetch(`${API_URL}/competitions/slug/${params.competitionSlug}`);
        if (!competitionResponse.ok) {
          throw new Error('Competição não encontrada');
        }
        const competitionData: Competition = await competitionResponse.json();
        setCompetition(competitionData);

        // 2. Buscar todas as partidas
        try {
          const matchesResponse = await fetch(`${API_URL}/matches/competition/${competitionData.id}`);
          if (matchesResponse.ok) {
            const matchesData: Match[] = await matchesResponse.json();
            setAllMatches(matchesData);
          }
        } catch (err) {
          console.warn('Erro ao carregar partidas:', err);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.competitionSlug]);

  // Filtrar partidas de mata-mata
  const knockoutMatches = allMatches.filter(match => {
    // Para competições mata-mata puras, mostrar todas as partidas
    if (competition && isKnockoutCompetition(competition.type)) {
      return match.phase && isKnockoutPhase(match.phase);
    }
    // Para outras competições, filtrar apenas por fase específica
    return match.phase && isKnockoutPhase(match.phase);
  });

  // Agrupar partidas em confrontos
  const knockoutTies = groupMatchesIntoTies(knockoutMatches);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar dados</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (knockoutMatches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Chaveamento não disponível</h2>
          <p className="text-gray-600">Esta competição ainda não possui fase de mata-mata ou o chaveamento ainda não foi definido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Chaveamento
          </h1>
          <p className="text-xl text-gray-600">
            {competition?.name} - {competition?.season}
          </p>
        </div>

        {/* Chaveamento */}
        <TournamentBracket 
          ties={knockoutTies} 
          competitionName={competition?.name}
        />
      </div>
    </div>
  );
} 