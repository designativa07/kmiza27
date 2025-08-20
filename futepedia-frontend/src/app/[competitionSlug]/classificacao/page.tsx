'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTeamLogoUrl } from '@/lib/cdn-simple';
import TeamLogo from '@/components/TeamLogo';
import { RoundNavigator } from '@/components/RoundNavigator';
import { createKnockoutTies, isKnockoutCompetition, shouldShowBracket } from '@/lib/competition-utils';
import { Match } from '@/types/match';
import Link from 'next/link';

// Interfaces
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
    short_name?: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Função para gerar nome curto como fallback
const generateShortName = (fullName: string): string => {
  // Se tem hífen, pega a primeira parte
  if (fullName.includes('-')) {
    return fullName.split('-')[0].trim();
  }
  
  // Se tem múltiplas palavras, pega as primeiras letras
  const words = fullName.split(' ').filter(word => word.length > 0);
  if (words.length > 1) {
    return words.map(word => word.charAt(0).toUpperCase()).join('').substring(0, 3);
  }
  
  // Se é uma palavra só, pega os primeiros 3-4 caracteres
  return fullName.substring(0, Math.min(4, fullName.length)).toUpperCase();
};

// Função para formatar a data
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

// Função para buscar os dados no servidor
async function getClassificationData(slug: string): Promise<{ competition: Competition, standings: Standing[], matches: Match[], rounds: Round[] }> {
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
    // Primeiro, verificar se a competição tem grupos verificando se há partidas com group_name
    const testGroupsResponse = await fetch(`${API_URL}/standings/competition/${competition.id}/groups`, { cache: 'no-store' });
    const hasGroups = testGroupsResponse.ok && (await testGroupsResponse.json()).length > 0;
    
    // Se há grupos, buscar apenas rodadas que têm jogos com grupos
    const roundsUrl = hasGroups 
      ? `${API_URL}/standings/competition/${competition.id}/rounds?onlyWithGroups=true`
      : `${API_URL}/standings/competition/${competition.id}/rounds`;
    
    const roundsResponse = await fetch(roundsUrl, { cache: 'no-store' });
    if (roundsResponse.ok) {
      roundsData = await roundsResponse.json();
    }
  } catch (err) {
    console.warn('Erro ao carregar rodadas:', err);
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

function ClassificacaoPage({ params }: { params: { competitionSlug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { competitionSlug } = params;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getClassificationData(competitionSlug);
        setCompetition(data.competition);
        setStandings(data.standings);
        setMatches(data.matches);
        setRounds(data.rounds);

        // Encontrar a rodada com a data mais atual (mais próxima da data atual)
        const filteredRounds = data.rounds.filter(round => typeof round.round_number === 'number');
        let initialRound: Round | null = null;
        
        if (filteredRounds.length > 0) {
          const now = new Date();
          let closestRound: Round | null = null;
          let smallestTimeDiff = Infinity;
          
          // Para cada rodada, encontrar a data mais próxima da atual
          for (const round of filteredRounds) {
            const roundMatches = data.matches.filter(match => match.round?.id === round.id);
            
            if (roundMatches.length > 0) {
              // Encontrar a data mais próxima da atual nesta rodada
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
          
          // Se não encontrou nenhuma rodada com datas, usar a última rodada como fallback
          initialRound = closestRound || filteredRounds.reduce((prev, current) => 
            (prev.round_number > current.round_number) ? prev : current
          );
        }

        const roundIdFromUrl = searchParams.get('roundId');
        if (roundIdFromUrl) {
          const parsedRoundId = parseInt(roundIdFromUrl);
          const roundFromUrl = data.rounds.find(r => r.id === parsedRoundId);
          if (roundFromUrl) {
            setCurrentRoundId(roundFromUrl.id);
            setCurrentRoundNumber(roundFromUrl.round_number);
          } else if (initialRound) {
            setCurrentRoundId(initialRound.id);
            setCurrentRoundNumber(initialRound.round_number);
          }
        } else if (initialRound) {
          setCurrentRoundId(initialRound.id);
          setCurrentRoundNumber(initialRound.round_number);
        }

      } catch (err: any) {
        console.error('Erro ao buscar dados da classificação:', err);
        setError(err.message || 'Erro ao carregar dados.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [competitionSlug]);

  // Estado para a rodada atualmente selecionada
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number | null>(null);

  // Lógica para navegação de rodadas
  const handleRoundChange = (roundId: number, roundNumber: number) => {
    setCurrentRoundId(roundId);
    setCurrentRoundNumber(roundNumber);
    router.push(`/${competitionSlug}/classificacao?roundId=${roundId}`, { scroll: false });
  };

  // Filtrar as partidas pela rodada selecionada
  const matchesForSelectedRound = currentRoundId 
    ? matches.filter(match => match.round?.id === currentRoundId) 
    : matches;

  // Agrupar classificação por grupo
  const standingsByGroup = standings.reduce((acc, standing) => {
    const groupName = standing.group_name || 'Classificação Geral';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(standing);
    return acc;
  }, {} as Record<string, Standing[]>);

  // Verificar se é competição apenas mata-mata (sem grupos)
  const isPureKnockoutCompetition = competition?.type?.toLowerCase() === 'mata_mata' || 
                                   competition?.type?.toLowerCase() === 'torneio' ||
                                   competition?.type?.toLowerCase() === 'knockout';

  const handleRowClick = (teamId: number) => {
    router.push(`/time/${teamId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <p className="text-xl text-gray-600">Carregando classificação...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <p className="text-xl text-red-600">Erro: {error}</p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <p className="text-xl text-gray-600">Competição não encontrada.</p>
      </div>
    );
  }

  // Para competições apenas mata-mata, mostrar apenas os jogos
  if (isPureKnockoutCompetition) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-2 sm:px-4 py-4">
          {/* Container para competições de mata-mata */}
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

            {/* Confrontos da rodada */}
            <div className="px-4 pb-3">
              {matchesForSelectedRound.length > 0 ? (
                <div className="space-y-0">
                  {matchesForSelectedRound
                    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                    .map((match) => (
                      <MatchCard key={match.id} match={match} formatDate={formatDate} getTeamLogoUrl={getTeamLogoUrl} />
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhum confronto encontrado para esta rodada.
                </p>
              )}
            </div>
          </div>

          {/* Seção de estatísticas adaptada para mata-mata */}
          <div className="mt-8 bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Informações da Competição</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{rounds.length}</div>
                <div className="text-sm text-gray-600">Fases</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{matches.length}</div>
                <div className="text-sm text-gray-600">Partidas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 py-4">

        {/* Layout baseado no tipo de competição */}
        {Object.keys(standingsByGroup).length > 1 ? (
          // Layout para competições com grupos
          <div className="space-y-8">
            {Object.entries(standingsByGroup).map(([groupName, groupStandings]) => (
              <div key={groupName} className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
                {/* Classificação do grupo (3/5 do espaço em XL) */}
                <div className="xl:col-span-3">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {groupName === 'Classificação Geral' ? '' : `Grupo ${groupName}`}
                    </h2>
                    <StandingsTable standings={groupStandings} onRowClick={handleRowClick} />
                  </div>
                  
                {/* Jogos do grupo (2/5 do espaço em XL) */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-lg overflow-hidden">
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
                    <div className="px-4 pb-3">
                      {matchesForSelectedRound
                        .filter(match => (match.group_name || 'Geral') === groupName)
                        .map((match) => (
                          <MatchCard key={match.id} match={match} formatDate={formatDate} getTeamLogoUrl={getTeamLogoUrl} />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Sem grupos - Layout lado a lado
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
            {/* Classificação (3/5 do espaço em XL) */}
            <div className="xl:col-span-3">
                <StandingsTable standings={standings} onRowClick={handleRowClick} />
            </div>
            
            {/* Jogos da rodada atual */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-lg overflow-hidden">
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
                <div className="px-4 pb-3">
                  {matchesForSelectedRound.map((match) => (
                    <MatchCard key={match.id} match={match} formatDate={formatDate} getTeamLogoUrl={getTeamLogoUrl} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção adicional para estatísticas */}
        <div className="mt-8 bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-100">
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
    <div className="py-2.5 border-b border-gray-200 last:border-b-0">
      {/* Data, hora e estádio */}
      <div className="text-center text-xs text-gray-600 mb-2.5">
        <span>{formatDate(match.match_date)}</span>
        {match.stadium && (
          <span className="ml-2">
            • {match.stadium.name}
            {match.stadium.city && ` (${match.stadium.city})`}
          </span>
        )}
      </div>
      
      {/* Confronto */}
      <div className="flex items-center justify-center mb-2.5">
        {/* Lado esquerdo: mandante + escudo */}
        <div className="flex items-center justify-end flex-1 pr-3">
          <span className="font-semibold text-gray-800 mr-2 text-sm">{match.home_team.name}</span>
          <img 
            src={getTeamLogoUrl(match.home_team.logo_url)} 
            alt={match.home_team.name} 
            className="h-8 w-8 object-contain"
          />
        </div>

        {/* Centro: placar fixo */}
        <div className="flex items-center justify-center min-w-[60px]">
          {(match.status === 'finished' || match.status === 'FINISHED' || (match.home_score !== null && match.away_score !== null)) ? (
            <>
              <span className="text-lg font-bold text-gray-800">{match.home_score}</span>
              <span className="text-lg font-bold text-gray-800 mx-1">×</span>
              <span className="text-lg font-bold text-gray-800">{match.away_score}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-400">×</span>
          )}
        </div>

        {/* Lado direito: escudo + visitante */}
        <div className="flex items-center justify-start flex-1 pl-3">
          <img 
            src={getTeamLogoUrl(match.away_team.logo_url)} 
            alt={match.away_team.name} 
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold text-gray-800 ml-2 text-sm">{match.away_team.name}</span>
        </div>
      </div>

      {/* Canais de Transmissão e Links */}
      {( (match.broadcasts && match.broadcasts.length > 0) || (match.broadcast_channels)) && (
        <div className="flex flex-wrap gap-1 justify-center mt-2">
          {/* Canais de Transmissão (apenas nome clicável) */}
          {match.broadcasts && match.broadcasts.length > 0 && (
            match.broadcasts.map((broadcast: any) => (
              <div key={broadcast.channel.id} className="flex items-center gap-1">
                {broadcast.channel.channel_link ? (
                  <a 
                    href={broadcast.channel.channel_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded hover:bg-indigo-200 transition-colors"
                  >
                    {broadcast.channel.name}
                  </a>
                ) : (
                  <span 
                    className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded"
                  >
                    {broadcast.channel.name}
                  </span>
                )}
              </div>
            ))
          )}
          {/* Botões 'ASSISTIR' da coluna broadcast_channels */}
          {typeof match.broadcast_channels === 'string' && match.broadcast_channels.trim() !== '' && (
            match.broadcast_channels.split(',').map((link: string, index: number) => {
              const url = link.startsWith('http') ? link : `https://${link}`;
              return (
                <a 
                  key={index} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
                >
                  ASSISTIR
                </a>
              );
            })
          )}
          {Array.isArray(match.broadcast_channels) && match.broadcast_channels.length > 0 && (
            match.broadcast_channels.map((link: string, index: number) => {
              const url = link.startsWith('http') ? link : `https://${link}`;
              return (
                <a 
                  key={index} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
                >
                  ASSISTIR
                </a>
              );
            })
          )}
        </div>
      )}
      
      {/* Link para Detalhes */}
      <div className="text-center mt-2">
        <Link href={`/jogos/${match.id}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
          VER DETALHES
        </Link>
      </div>
    </div>
  );
};

// Componente da tabela de classificação
interface StandingsTableProps {
  standings: Standing[];
  onRowClick: (teamId: number) => void;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings, onRowClick }) => {
  const getPositionClass = (position: number) => {
    if (position <= 3) return 'bg-green-500 text-white';
    if (position <= 6) return 'bg-blue-500 text-white';
    if (position <= 10) return 'bg-purple-500 text-white';
    return 'bg-gray-400 text-white';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-50 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] sm:min-w-[140px]">TIME</th>
              <th className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">PTS</th>
              <th className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">J</th>
              <th className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">V</th>
              <th className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">E</th>
              <th className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">D</th>
              <th className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">GP</th>
              <th className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">GC</th>
              <th className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">SG</th>
              <th className="px-1 sm:px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Últimos Jogos</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standings.map((standing, index) => {
              const isLibertadoresZone = index < 4; // Primeiras 4 posições
              const isRelegationZone = index >= standings.length - 4; // Últimas 4 posições
              
              let bgColor = 'bg-white';
              let hoverBgColor = 'group-hover:bg-gray-100';
              
              if (isLibertadoresZone) {
                bgColor = 'bg-green-50';
                hoverBgColor = 'group-hover:bg-green-200';
              } else if (isRelegationZone) {
                bgColor = 'bg-red-50';
                hoverBgColor = 'group-hover:bg-red-200';
              }
              
              return (
                <tr
                  key={standing.team.id}
                  className={`${bgColor} cursor-pointer group`}
                  onClick={() => onRowClick(standing.team.id)}
                >
                  <td className={`sticky left-0 z-20 ${bgColor} ${hoverBgColor} px-2 py-3 whitespace-nowrap min-w-[100px] sm:min-w-[140px]`}>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-3 min-w-[20px]">{standing.position}</span>
                      <TeamLogo
                        src={standing.team.logo_url ? getTeamLogoUrl(standing.team.logo_url) : null}
                        alt={standing.team.name}
                        size="sm"
                        className="mr-2"
                      />
                      {/* Nome completo em desktop, nome curto em mobile */}
                      <span className="text-xs font-medium text-gray-900 hidden sm:block">{standing.team.name}</span>
                      <span className="text-xs font-medium text-gray-900 block sm:hidden">
                        {standing.team.short_name || generateShortName(standing.team.name)}
                      </span>
                    </div>
                  </td>
                  <td className={`px-1 sm:px-2 py-3 whitespace-nowrap text-center min-w-[40px] ${hoverBgColor}`}>
                    <span className="text-sm font-bold text-gray-900">{standing.points}</span>
                  </td>
                  <td className={`px-1 sm:px-2 py-3 whitespace-nowrap text-center text-xs text-gray-500 min-w-[40px] ${hoverBgColor}`}>{standing.played}</td>
                  <td className={`px-1 sm:px-2 py-3 whitespace-nowrap text-center text-xs text-green-600 min-w-[40px] ${hoverBgColor}`}>{standing.won}</td>
                  <td className={`px-1 sm:px-2 py-3 whitespace-nowrap text-center text-xs text-yellow-600 min-w-[40px] ${hoverBgColor}`}>{standing.drawn}</td>
                  <td className={`px-1 sm:px-2 py-3 whitespace-nowrap text-center text-xs text-red-600 min-w-[40px] ${hoverBgColor}`}>{standing.lost}</td>
                  <td className={`px-1 sm:px-2 py-3 whitespace-nowrap text-center text-xs text-gray-500 min-w-[40px] ${hoverBgColor}`}>{standing.goals_for}</td>
                  <td className={`px-1 sm:px-2 py-3 whitespace-nowrap text-center text-xs text-gray-500 min-w-[40px] ${hoverBgColor}`}>{standing.goals_against}</td>
                  <td className={`px-1 sm:px-2 py-3 whitespace-nowrap text-center text-xs text-gray-500 min-w-[40px] ${hoverBgColor}`}>{standing.goal_difference}</td>
                  <td className={`px-1 sm:px-2 py-3 whitespace-nowrap text-center min-w-[80px] ${hoverBgColor}`}>
                    {standing.form && (
                      <div className="flex justify-center space-x-1">
                        {standing.form.split('').slice(-5).map((result, idx) => (
                          <span
                            key={idx}
                            className={`inline-block w-3.5 h-3.5 rounded-full text-xs text-white font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500' :
                              result === 'D' ? 'bg-yellow-500' :
                              result === 'L' ? 'bg-red-500' : 'bg-gray-400'
                            }`}
                          >
                            {result === 'W' ? 'V' : result === 'D' ? 'E' : 'D'}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassificacaoPage;