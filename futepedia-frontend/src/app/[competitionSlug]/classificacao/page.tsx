'use client';

import { useState, useEffect } from 'react';
import { StandingsTable } from '@/components/StandingsTable';
import { RoundNavigator } from '@/components/RoundNavigator';
import { TournamentBracket } from '@/components/TournamentBracket';
import { Match } from '@/types/match';
import { getApiUrl } from '@/lib/config';
import { getTeamLogoUrl } from '@/lib/cdn-simple';

// Tipos
interface Competition {
  id: number;
  name: string;
  slug: string;
  type: string;
  season: string;
  has_groups?: boolean;
}

interface Standing {
  position: number;
  team: {
    id: number;
    name: string;
    logo_url: string;
  };
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  form?: string;
  group_name?: string;
}

interface Round {
  id: number;
  name: string;
  round_number: number;
}

// Função para formatar a data (mesma da página de jogos)
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};

// Função para buscar dados (similar à página de jogos)
async function getClassificationData(slug: string): Promise<{ competition: Competition, standings: Standing[], matches: Match[], rounds: Round[] }> {
  const API_URL = getApiUrl();
  
  // 1. Buscar detalhes da competição
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { cache: 'no-store' });
  if (!competitionResponse.ok) throw new Error('Competição não encontrada');
  const competition: Competition = await competitionResponse.json();

  // 2. Buscar classificação
  const standingsResponse = await fetch(`${API_URL}/standings/competition/${competition.id}`, { cache: 'no-store' });
  if (!standingsResponse.ok) throw new Error('Classificação não encontrada');
  const standings: Standing[] = await standingsResponse.json();

  // 3. Buscar as rodadas da competição
  let roundsData: Round[] = [];
  try {
    const roundsResponse = await fetch(`${API_URL}/standings/competition/${competition.id}/rounds`, { cache: 'no-store' });
    if (roundsResponse.ok) {
      roundsData = await roundsResponse.json();
    }
  } catch (err) {
    console.warn('Erro ao carregar rodadas para a página de classificação:', err);
  }

  // 4. Buscar as partidas para cada rodada
  let allMatches: Match[] = [];
  if (roundsData.length > 0) {
    for (const round of roundsData) {
      try {
        const roundMatchesResponse = await fetch(`${API_URL}/standings/competition/${competition.id}/round/${round.id}/matches`, { cache: 'no-store' });
        if (roundMatchesResponse.ok) {
          const matchesForRound: Match[] = await roundMatchesResponse.json();
          // Anexar informações da rodada a cada partida
          matchesForRound.forEach(match => {
            match.round = {
              id: round.id,
              name: round.name,
              round_number: round.round_number
            };
          });
          allMatches.push(...matchesForRound);
        }
      } catch (err) {
        console.warn(`Erro ao carregar partidas para a rodada ${round.name}:`, err);
      }
    }
  }

  return { competition, standings, matches: allMatches, rounds: roundsData };
}

export default function ClassificacaoPage({ params }: { params: { competitionSlug: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  
  // Estados para navegação de jogos (igual à página de jogos)
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getClassificationData(params.competitionSlug);
        setCompetition(data.competition);
        setStandings(data.standings);
        setMatches(data.matches);
        setRounds(data.rounds);

        // Encontrar a rodada com a data mais atual (igual à página de jogos)
        const filteredRounds = data.rounds.filter(round => typeof round.round_number === 'number');
        let initialRound: Round | null = null;
        
        if (filteredRounds.length > 0) {
          const now = new Date();
          let closestRound: Round | null = null;
          let smallestTimeDiff = Infinity;
          
          for (const round of filteredRounds) {
            const roundMatches = data.matches.filter(match => match.round?.id === round.id);
            
            if (roundMatches.length > 0) {
              for (const match of roundMatches) {
                if (match.match_date) {
                  const matchDate = new Date(match.match_date);
                  const timeDiff = Math.abs(now.getTime() - matchDate.getTime());
                  
                  if (timeDiff < smallestTimeDiff) {
                    smallestTimeDiff = timeDiff;
                    closestRound = round;
                  }
                }
              }
            }
          }
          
          initialRound = closestRound || filteredRounds.reduce((prev, current) => 
            (prev.round_number > current.round_number) ? prev : current
          );
        }

        if (initialRound) {
          setCurrentRoundId(initialRound.id);
          setCurrentRoundNumber(initialRound.round_number);
        }

      } catch (err: any) {
        console.error('Erro ao buscar dados da classificação:', err);
        setError(err.message || 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.competitionSlug]);

  // Lógica para navegação de rodadas (igual à página de jogos)
  const handleRoundChange = (roundId: number, roundNumber: number) => {
    setCurrentRoundId(roundId);
    setCurrentRoundNumber(roundNumber);
  };

  // Filtrar as partidas pela rodada selecionada
  const matchesForSelectedRound = currentRoundId 
    ? matches.filter(match => match.round?.id === currentRoundId) 
    : matches;

  // Agrupar classificação por grupos
  const standingsByGroup = standings.reduce((acc, standing) => {
    const groupName = standing.group_name || 'Classificação Geral';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(standing);
    return acc;
  }, {} as Record<string, Standing[]>);

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

  const isKnockoutCompetition = (competitionType: string) => {
    return competitionType === 'mata_mata' || 
           competitionType === 'grupos_e_mata_mata' || 
           competitionType === 'copa';
  };

  // Filtrar partidas de mata-mata
  const knockoutMatches = matches.filter(match => {
    if (competition && isKnockoutCompetition(competition.type)) {
      return match.phase && isKnockoutPhase(match.phase);
    }
    return match.phase && isKnockoutPhase(match.phase);
  });

  const shouldShowBracket = knockoutMatches.length > 0 && 
    (competition && (isKnockoutCompetition(competition.type) || knockoutMatches.length > 0));

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        {/* Mostrar chaveamento se for mata-mata */}
        {shouldShowBracket && (
          <div className="mb-8">
            <TournamentBracket 
              matches={knockoutMatches} 
              competitionName={competition?.name}
            />
          </div>
        )}

        {/* Layout baseado no tipo de competição */}
        {Object.keys(standingsByGroup).length > 1 ? (
          // Layout para competições com grupos
          <div className="space-y-8">
            {Object.entries(standingsByGroup).map(([groupName, groupStandings]) => (
              <div key={groupName} className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
                  {/* Classificação do grupo (2/3 do espaço em XL) */}
                  <div className="xl:col-span-2">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                      {groupName === 'Classificação Geral' ? 'Classificação' : `Grupo ${groupName}`}
                    </h2>
                    <StandingsTable standings={groupStandings} />
                  </div>
                  
                  {/* Jogos do grupo (1/3 do espaço em XL) */}
                  <div className="xl:col-span-1">
                    <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                      {/* Navegação de Rodadas para este grupo */}
                      {currentRoundId && currentRoundNumber && rounds.length > 1 && (
                        <RoundNavigator
                          competitionType={competition?.type || ''}
                          rounds={rounds.filter(round => typeof round.round_number === 'number')}
                          currentRoundId={currentRoundId}
                          currentRoundNumber={currentRoundNumber}
                          onRoundChange={handleRoundChange}
                        />
                      )}

                      {/* Jogos do grupo */}
                      <div className="p-6">
                        <div className="space-y-4">
                          {matchesForSelectedRound
                            .filter(match => (match.group_name || 'Geral') === groupName)
                            .map((match) => (
                              <MatchCard key={match.id} match={match} formatDate={formatDate} getTeamLogoUrl={getTeamLogoUrl} />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Layout tradicional para competições sem grupos
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Classificação */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Classificação</h2>
              <StandingsTable standings={standings} />
            </div>
            
            {/* Jogos da rodada atual */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                {/* Navegação de Rodadas */}
                {currentRoundId && currentRoundNumber && rounds.length > 1 && (
                  <RoundNavigator
                    competitionType={competition?.type || ''}
                    rounds={rounds.filter(round => typeof round.round_number === 'number')}
                    currentRoundId={currentRoundId}
                    currentRoundNumber={currentRoundNumber}
                    onRoundChange={handleRoundChange}
                  />
                )}

                {/* Jogos */}
                <div className="p-6">
                  <div className="space-y-4">
                    {matchesForSelectedRound.map((match) => (
                      <MatchCard key={match.id} match={match} formatDate={formatDate} getTeamLogoUrl={getTeamLogoUrl} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção adicional para estatísticas se não for mata-mata */}
        {!shouldShowBracket && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Estatísticas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{standings.length}</div>
                <div className="text-sm text-gray-600">Times</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{rounds.length}</div>
                <div className="text-sm text-gray-600">Rodadas</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{matches.length}</div>
                <div className="text-sm text-gray-600">Partidas</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente MatchCard (igual ao da página de jogos)
interface MatchCardProps {
  match: Match;
  formatDate: (dateString: string) => string;
  getTeamLogoUrl: (logoUrl: string) => string;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, formatDate, getTeamLogoUrl }) => {
  return (
    <div className="bg-gray-50 p-3 rounded-lg border hover:border-indigo-500 transition-all">
      <div className="text-center text-xs text-gray-600 mb-2">
        <span>{formatDate(match.match_date)}</span>
        {match.stadium && (
          <span className="ml-2">
            • {match.stadium.name}
            {match.stadium.city && ` (${match.stadium.city})`}
          </span>
        )}
      </div>
      <div className="flex items-center justify-center">
        {/* Lado esquerdo: mandante + escudo */}
        <div className="flex items-center justify-end flex-1 pr-1">
          <span className="font-semibold text-gray-800 mr-1 text-sm">{match.home_team.name}</span>
          <img 
            src={getTeamLogoUrl(match.home_team.logo_url)} 
            alt={match.home_team.name} 
            className="h-6 w-6 object-contain"
          />
        </div>

        {/* Centro: placar fixo */}
        <div className="flex items-center justify-center min-w-[50px]">
          {(match.status === 'finished' || match.status === 'FINISHED' || (match.home_score !== null && match.away_score !== null)) ? (
            <>
              <span className="text-lg font-bold text-gray-800">{match.home_score}</span>
              <span className="text-lg font-bold text-gray-800 mx-0.5">×</span>
              <span className="text-lg font-bold text-gray-800">{match.away_score}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-400">×</span>
          )}
        </div>

        {/* Lado direito: escudo + visitante */}
        <div className="flex items-center justify-start flex-1 pl-1">
          <img 
            src={getTeamLogoUrl(match.away_team.logo_url)} 
            alt={match.away_team.name} 
            className="h-6 w-6 object-contain"
          />
          <span className="font-semibold text-gray-800 ml-1 text-sm">{match.away_team.name}</span>
        </div>
      </div>
    </div>
  );
};