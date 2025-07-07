'use client';

import Link from 'next/link';
import type { NextPage } from 'next';
import { getTeamLogoUrl } from '@/lib/cdn';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoundNavigator } from '@/components/RoundNavigator';
import { createKnockoutTies, isRoundKnockout } from '@/lib/competition-utils';
import { Match } from '@/types/match';

// Interfaces
interface Competition {
  id: number;
  name: string;
  slug: string;
  type: string;
  season: string;
}

interface Round {
  id: number;
  name: string;
  round_number: number;
}

// Definir um tipo para as props da página
type Props = {
  params: { competitionSlug: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Função para buscar os dados no servidor
async function getMatchesData(slug: string): Promise<{ competition: Competition, matches: Match[], rounds: Round[] }> {
  // 1. Buscar detalhes da competição
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { cache: 'no-store' });
  if (!competitionResponse.ok) throw new Error('Competição não encontrada');
  const competition: Competition = await competitionResponse.json();

  // 2. Buscar TODAS as rodadas da competição para a página de Jogos
  let roundsData: Round[] = [];
  try {
    const roundsUrl = `${API_URL}/standings/competition/${competition.id}/rounds`;
    
    const roundsResponse = await fetch(roundsUrl, { cache: 'no-store' });
    if (roundsResponse.ok) {
      roundsData = await roundsResponse.json();
    }
  } catch (err) {
    console.warn('Erro ao carregar rodadas para a página de jogos:', err);
  }

  // 3. Buscar as partidas para cada rodada
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

  return { competition, matches: allMatches, rounds: roundsData };
}

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

// Componente de página agora usa o tipo 'NextPage' com as nossas Props
const MatchesPage = ({ params }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { competitionSlug } = params;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMatchesData(competitionSlug);
        setCompetition(data.competition);
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
        console.error('Erro ao buscar dados das partidas:', err);
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
    router.push(`/${competitionSlug}/jogos?roundId=${roundId}`, { scroll: false });
  };

  // Filtrar as partidas pela rodada selecionada (se houver)
  const filteredMatches = currentRoundId 
    ? matches.filter(match => match.round?.id === currentRoundId) 
    : matches;

  // Verificar se as partidas da rodada atual são mata-mata
  // Usar o campo is_knockout das partidas em vez de lógica complexa
  const isKnockout = filteredMatches.some(match => match.is_knockout);
  
  // Agrupar partidas por tie_id (igual ao painel admin)
  const groupedMatchesByTieId = useMemo(() => {
    const grouped: { [key: string]: Match[] } = {};
    filteredMatches.forEach(match => {
      const key = match.tie_id || match.id.toString();
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(match);
    });
    // Ordenar as partidas dentro de cada confronto para garantir que ida venha antes de volta
    for (const key in grouped) {
      if (grouped.hasOwnProperty(key)) {
        grouped[key].sort((a, b) => {
          if (a.leg === 'first_leg' && b.leg === 'second_leg') return -1;
          if (a.leg === 'second_leg' && b.leg === 'first_leg') return 1;
          return 0;
        });
      }
    }
    return grouped;
  }, [filteredMatches]);



  if (isLoading) {
    return (
      <main className="container mx-auto pt-0 p-4">
        <div className="flex justify-center items-center h-screen">
          <p className="text-xl text-gray-600">Carregando jogos...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto pt-0 p-4">
        <div className="flex justify-center items-center h-screen">
          <p className="text-xl text-red-600">Erro: {error}</p>
        </div>
      </main>
    );
  }

  if (!competition) {
    return (
      <main className="container mx-auto pt-0 p-4">
        <div className="flex justify-center items-center h-screen">
          <p className="text-xl text-gray-600">Competição não encontrada.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto pt-0 p-4">
      {/* Container unificado: Navegação + Jogos */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="space-y-2">
          {/* Renderizar RoundNavigator sempre que houver rounds */}
          {rounds.length > 0 && (
            <RoundNavigator 
              rounds={rounds} 
              currentRoundId={currentRoundId} 
              currentRoundNumber={currentRoundNumber} 
              competitionType={competition?.type || ''} 
              onRoundChange={handleRoundChange} 
            />
          )}
          
          {/* Conteúdo principal - Mata-mata ou Lista de Jogos */}
          <div className="px-4 pb-3">
            {isKnockout && Object.keys(groupedMatchesByTieId).length > 0 ? (
              /* Formato de Mata-mata Simples */
              <div className="space-y-4">
                {Object.keys(groupedMatchesByTieId).map((tieId, index) => {
                  const matchesInTie = groupedMatchesByTieId[tieId];
                  return (
                    <KnockoutTieCard 
                      key={tieId} 
                      matches={matchesInTie} 
                      formatDate={formatDate} 
                      getTeamLogoUrl={getTeamLogoUrl} 
                    />
                  );
                })}
              </div>
            ) : filteredMatches.length > 0 ? (
              /* Verificar se há grupos nas partidas */
              (() => {
                // Agrupar partidas por grupo
                const matchesByGroup = filteredMatches.reduce((acc, match) => {
                  const groupName = match.group_name || 'Sem Grupo';
                  if (!acc[groupName]) {
                    acc[groupName] = [];
                  }
                  acc[groupName].push(match);
                  return acc;
                }, {} as Record<string, Match[]>);

                const groupNames = Object.keys(matchesByGroup);
                const hasGroups = groupNames.length > 1 || (groupNames.length === 1 && groupNames[0] !== 'Sem Grupo');

                if (hasGroups) {
                  // Renderizar por grupos
                  return (
                    <div className="space-y-6">
                      {Object.entries(matchesByGroup)
                        .filter(([groupName]) => groupName !== 'Sem Grupo') // Filtrar apenas grupos válidos
                        .sort(([a], [b]) => a.localeCompare(b)) // Ordenar grupos alfabeticamente
                        .map(([groupName, groupMatches]) => (
                          <div key={groupName} className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-800 text-center py-2 bg-gray-50 rounded-md border">
                              Grupo {groupName}
                            </h3>
                            <div className="space-y-0">
                              {groupMatches
                                .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()) // Ordenar por data
                                .map(match => (
                                  <MatchCard 
                                    key={match.id} 
                                    match={match} 
                                    formatDate={formatDate} 
                                    getTeamLogoUrl={getTeamLogoUrl} 
                                  />
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                } else {
                  // Renderizar formato tradicional (sem grupos)
                  return filteredMatches
                    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                    .map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        formatDate={formatDate} 
                        getTeamLogoUrl={getTeamLogoUrl} 
                      />
                    ));
                }
              })()
            ) : (
              <p className="text-center text-gray-500 py-4">
                {isKnockout ? 'Nenhum confronto encontrado para esta rodada' : 'Nenhuma partida encontrada para esta rodada'}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

// Componente para renderizar os botões de transmissão
const BroadcastButtons: React.FC<{ match: Match }> = ({ match }) => {
  if (!match || (!match.broadcasts?.length && !match.broadcast_channels)) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      {/* Canais de Transmissão (da relação broadcasts) */}
      {match.broadcasts?.map((broadcast: any) => (
        <div key={broadcast.channel.id} className="flex items-center gap-2">
          {broadcast.channel.channel_link ? (
            <a 
              href={broadcast.channel.channel_link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md hover:bg-indigo-200 transition-colors shadow-sm"
            >
              {broadcast.channel.name}
            </a>
          ) : (
            <span 
              className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md shadow-sm"
            >
              {broadcast.channel.name}
            </span>
          )}
        </div>
      ))}
      
      {/* Links de broadcast_channels */}
      {typeof match.broadcast_channels === 'string' && match.broadcast_channels.trim() !== '' && (
        match.broadcast_channels.split(',').map((link: string, index: number) => {
          const url = link.startsWith('http') ? link : `https://${link}`;
          return (
            <a 
              key={index} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors shadow-sm"
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
              className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors shadow-sm"
            >
              ASSISTIR
            </a>
          );
        })
      )}
    </div>
  );
};


// Componente para confrontos de mata-mata (formato simples)
interface KnockoutTieCardProps {
  matches: Match[];
  formatDate: (dateString: string) => string;
  getTeamLogoUrl: (logoUrl: string) => string;
}

const KnockoutTieCard: React.FC<KnockoutTieCardProps> = ({ matches, formatDate, getTeamLogoUrl }) => {
  // Função para calcular o placar agregado corretamente
  const calculateAggregate = (matches: Match[]) => {
    if (matches.length !== 2) return null;
    
    const firstLeg = matches.find(m => m.leg === 'first_leg');
    const secondLeg = matches.find(m => m.leg === 'second_leg');
    
    if (!firstLeg || !secondLeg) return null;
    
    // Verificar se ambos os jogos têm placares
    const firstLegFinished = firstLeg.home_score !== null && firstLeg.away_score !== null;
    const secondLegFinished = secondLeg.home_score !== null && secondLeg.away_score !== null;
    
    if (!firstLegFinished || !secondLegFinished) return null;
    
    // Calcular agregado corretamente:
    // Time A (mandante ida) = placar mandante ida + placar visitante volta
    // Time B (visitante ida) = placar visitante ida + placar mandante volta
    const teamA = firstLeg.home_team;
    const teamB = firstLeg.away_team;
    
    const teamA_aggregate = (firstLeg.home_score || 0) + (secondLeg.away_score || 0);
    const teamB_aggregate = (firstLeg.away_score || 0) + (secondLeg.home_score || 0);
    
    // Verificar quem se classificou
    let qualified = null;
    let wonByPenalties = false;
    
    if (teamA_aggregate > teamB_aggregate) {
      qualified = teamA;
    } else if (teamB_aggregate > teamA_aggregate) {
      qualified = teamB;
    } else {
      // Empate no agregado - verificar pênaltis
      const penaltiesMatch = [firstLeg, secondLeg].find(m => 
        m.home_score_penalties !== null && m.away_score_penalties !== null
      );
      
      if (penaltiesMatch) {
        wonByPenalties = true;
        if ((penaltiesMatch.home_score_penalties || 0) > (penaltiesMatch.away_score_penalties || 0)) {
          qualified = penaltiesMatch.home_team;
        } else {
          qualified = penaltiesMatch.away_team;
        }
      }
    }
    
    return {
      teamA,
      teamB,
      teamA_aggregate,
      teamB_aggregate,
      qualified,
      wonByPenalties,
      firstLeg,
      secondLeg
    };
  };

  // Para confrontos de ida e volta
  if (matches.length === 2) {
    const aggregate = calculateAggregate(matches);
    
    if (!aggregate) {
      // Se não conseguir calcular agregado, mostrar no mesmo formato lado a lado
      const firstLeg = matches.find(m => m.leg === 'first_leg') || matches[0];
      const secondLeg = matches.find(m => m.leg === 'second_leg') || matches[1];
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* Jogos lado a lado na parte superior */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Jogo de Ida */}
            {firstLeg && (
              <div className="text-center">
                <div className="font-semibold text-blue-600 text-sm mb-2">JOGO DE IDA</div>
                <div className="text-gray-500 text-xs mb-3">
                  {formatDate(firstLeg.match_date)}
                  <br />{firstLeg.stadium?.name}
                </div>
                
                {/* Layout do jogo */}
                <div className="flex items-center justify-center space-x-2 mb-3">
                  {/* Mandante */}
                  <div className="flex items-center space-x-1 flex-1 justify-end">
                    <span className="font-medium text-gray-800 text-xs truncate">{firstLeg.home_team.name}</span>
                    <img
                      src={getTeamLogoUrl(firstLeg.home_team.logo_url)}
                      alt={`${firstLeg.home_team.name} logo`}
                      className="w-6 h-6 object-contain"
                    />
                  </div>

                  {/* Placar */}
                  <div className="flex items-center space-x-1 px-2">
                    <span className="text-lg font-bold text-gray-900">
                      {firstLeg.home_score !== null ? firstLeg.home_score : '-'}
                    </span>
                    <span className="text-gray-500 font-medium">×</span>
                    <span className="text-lg font-bold text-gray-900">
                      {firstLeg.away_score !== null ? firstLeg.away_score : '-'}
                    </span>
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center space-x-1 flex-1">
                    <img
                      src={getTeamLogoUrl(firstLeg.away_team.logo_url)}
                      alt={`${firstLeg.away_team.name} logo`}
                      className="w-6 h-6 object-contain"
                    />
                    <span className="font-medium text-gray-800 text-xs truncate">{firstLeg.away_team.name}</span>
                  </div>
                </div>
                
                <BroadcastButtons match={firstLeg} />
              </div>
            )}

            {/* Jogo de Volta */}
            {secondLeg && (
              <div className="text-center">
                <div className="font-semibold text-blue-600 text-sm mb-2">JOGO DE VOLTA</div>
                <div className="text-gray-500 text-xs mb-3">
                  {formatDate(secondLeg.match_date)}
                  <br />{secondLeg.stadium?.name}
                </div>
                
                {/* Layout do jogo */}
                <div className="flex items-center justify-center space-x-2 mb-3">
                  {/* Mandante */}
                  <div className="flex items-center space-x-1 flex-1 justify-end">
                    <span className="font-medium text-gray-800 text-xs truncate">{secondLeg.home_team.name}</span>
                    <img
                      src={getTeamLogoUrl(secondLeg.home_team.logo_url)}
                      alt={`${secondLeg.home_team.name} logo`}
                      className="w-6 h-6 object-contain"
                    />
                  </div>

                  {/* Placar */}
                  <div className="flex items-center space-x-1 px-2">
                    <span className="text-lg font-bold text-gray-900">
                      {secondLeg.home_score !== null ? secondLeg.home_score : '-'}
                    </span>
                    <span className="text-gray-500 font-medium">×</span>
                    <span className="text-lg font-bold text-gray-900">
                      {secondLeg.away_score !== null ? secondLeg.away_score : '-'}
                    </span>
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center space-x-1 flex-1">
                    <img
                      src={getTeamLogoUrl(secondLeg.away_team.logo_url)}
                      alt={`${secondLeg.away_team.name} logo`}
                      className="w-6 h-6 object-contain"
                    />
                    <span className="font-medium text-gray-800 text-xs truncate">{secondLeg.away_team.name}</span>
                  </div>
                </div>

                {/* Mostrar pênaltis se houver */}
                {secondLeg.home_score_penalties !== null && secondLeg.away_score_penalties !== null && (
                  <div className="text-xs text-gray-600 mb-2">
                    Pênaltis: {secondLeg.home_score_penalties} × {secondLeg.away_score_penalties}
                  </div>
                )}
                
                <BroadcastButtons match={secondLeg} />
              </div>
            )}
          </div>

          {/* Resultado sem agregado calculado */}
          <div className="border-t pt-3 text-center">
            <div className="text-sm text-gray-600">
              Confronto de Ida e Volta
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {/* Jogos lado a lado na parte superior */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Jogo de Ida */}
          <div className="text-center">
            <div className="font-semibold text-blue-600 text-sm mb-2">JOGO DE IDA</div>
            <div className="text-gray-500 text-xs mb-3">
              {formatDate(aggregate.firstLeg.match_date)}
              <br />{aggregate.firstLeg.stadium?.name}
            </div>
            
            {/* Layout do jogo */}
            <div className="flex items-center justify-center space-x-2 mb-3">
              {/* Mandante */}
              <div className="flex items-center space-x-1 flex-1 justify-end">
                <span className="font-medium text-gray-800 text-xs truncate">{aggregate.firstLeg.home_team.name}</span>
                <img
                  src={getTeamLogoUrl(aggregate.firstLeg.home_team.logo_url)}
                  alt={`${aggregate.firstLeg.home_team.name} logo`}
                  className="w-6 h-6 object-contain"
                />
              </div>

              {/* Placar */}
              <div className="flex items-center space-x-1 px-2">
                <span className="text-lg font-bold text-gray-900">
                  {aggregate.firstLeg.home_score}
                </span>
                <span className="text-gray-500 font-medium">×</span>
                <span className="text-lg font-bold text-gray-900">
                  {aggregate.firstLeg.away_score}
                </span>
              </div>

              {/* Visitante */}
              <div className="flex items-center space-x-1 flex-1">
                <img
                  src={getTeamLogoUrl(aggregate.firstLeg.away_team.logo_url)}
                  alt={`${aggregate.firstLeg.away_team.name} logo`}
                  className="w-6 h-6 object-contain"
                />
                <span className="font-medium text-gray-800 text-xs truncate">{aggregate.firstLeg.away_team.name}</span>
              </div>
            </div>
            
            <BroadcastButtons match={aggregate.firstLeg} />
          </div>

          {/* Jogo de Volta */}
          <div className="text-center">
            <div className="font-semibold text-blue-600 text-sm mb-2">JOGO DE VOLTA</div>
            <div className="text-gray-500 text-xs mb-3">
              {formatDate(aggregate.secondLeg.match_date)}
              <br />{aggregate.secondLeg.stadium?.name}
            </div>
            
            {/* Layout do jogo */}
            <div className="flex items-center justify-center space-x-2 mb-3">
              {/* Mandante */}
              <div className="flex items-center space-x-1 flex-1 justify-end">
                <span className="font-medium text-gray-800 text-xs truncate">{aggregate.secondLeg.home_team.name}</span>
                <img
                  src={getTeamLogoUrl(aggregate.secondLeg.home_team.logo_url)}
                  alt={`${aggregate.secondLeg.home_team.name} logo`}
                  className="w-6 h-6 object-contain"
                />
              </div>

              {/* Placar */}
              <div className="flex items-center space-x-1 px-2">
                <span className="text-lg font-bold text-gray-900">
                  {aggregate.secondLeg.home_score}
                </span>
                <span className="text-gray-500 font-medium">×</span>
                <span className="text-lg font-bold text-gray-900">
                  {aggregate.secondLeg.away_score}
                </span>
              </div>

              {/* Visitante */}
              <div className="flex items-center space-x-1 flex-1">
                <img
                  src={getTeamLogoUrl(aggregate.secondLeg.away_team.logo_url)}
                  alt={`${aggregate.secondLeg.away_team.name} logo`}
                  className="w-6 h-6 object-contain"
                />
                <span className="font-medium text-gray-800 text-xs truncate">{aggregate.secondLeg.away_team.name}</span>
              </div>
            </div>

            {/* Mostrar pênaltis se houver */}
            {aggregate.secondLeg.home_score_penalties !== null && aggregate.secondLeg.away_score_penalties !== null && (
              <div className="text-xs text-gray-600 mb-2">
                Pênaltis: {aggregate.secondLeg.home_score_penalties} × {aggregate.secondLeg.away_score_penalties}
              </div>
            )}
            
            <BroadcastButtons match={aggregate.secondLeg} />
          </div>
        </div>

        {/* Resultado final - parte inferior */}
        <div className="border-t pt-3 text-center">
          {aggregate.qualified && (
            <div className="mb-2">
              <div className="text-sm font-semibold text-green-700">
                🏆 Classificado: {aggregate.qualified.name}
                {aggregate.wonByPenalties && (
                  <span className="text-xs text-green-600 block mt-1">
                    (Decidido nos pênaltis)
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            Agregado: {aggregate.teamA_aggregate} × {aggregate.teamB_aggregate}
          </div>
        </div>
      </div>
    );
  }

  // Para jogos únicos
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {matches.map(match => (
        <div key={match.id}>
          {/* Data, Hora, Estádio */}
          <div className="text-center text-gray-600 text-sm mb-3">
            {formatDate(match.match_date)}
            {match.stadium?.name && ` • ${match.stadium.name}`}
            {match.stadium?.city && `, ${match.stadium.city}`}
          </div>

          {/* Layout: Mandante (escudo) (placar) X (placar) (escudo) Visitante */}
          <div className="flex items-center justify-center space-x-4">
            {/* Mandante */}
            <div className="flex items-center space-x-2 flex-1 justify-end">
              <span className="font-semibold text-gray-800">{match.home_team.name}</span>
              <img
                src={getTeamLogoUrl(match.home_team.logo_url)}
                alt={`${match.home_team.name} logo`}
                className="w-10 h-10 object-contain"
              />
            </div>

            {/* Placar */}
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-gray-900">
                {match.home_score !== null ? match.home_score : '-'} × {match.away_score !== null ? match.away_score : '-'}
              </div>
            </div>

            {/* Visitante */}
            <div className="flex items-center space-x-2 flex-1">
              <img
                src={getTeamLogoUrl(match.away_team.logo_url)}
                alt={`${match.away_team.name} logo`}
                className="w-10 h-10 object-contain"
              />
              <span className="font-semibold text-gray-800">{match.away_team.name}</span>
            </div>
          </div>

          {/* Pênaltis (se houver) */}
          {match.home_score_penalties !== null && match.away_score_penalties !== null && (
            <div className="text-center text-sm text-gray-600 mt-2">
              Pênaltis: {match.home_score_penalties} × {match.away_score_penalties}
            </div>
          )}
          
          {/* Classificado seria determinado por outros critérios se necessário */}
          
          {/* Botões de transmissão */}
          <div className="mt-3">
            <BroadcastButtons match={match} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente auxiliar para renderizar um único cartão de partida
interface MatchCardProps {
  match: Match;
  formatDate: (dateString: string) => string;
  getTeamLogoUrl: (logoUrl: string) => string;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, formatDate, getTeamLogoUrl }) => {
  return (
    <div className="py-2.5 border-b border-gray-200 last:border-b-0">
      <div className="text-center text-sm text-gray-600 mb-2.5">
        <span>{formatDate(match.match_date)}</span>
        {match.stadium && (
          <span className="ml-2">
            • {match.stadium.name}
            {match.stadium.city && ` (${match.stadium.city})`}
          </span>
        )}
      </div>
      <div className="flex items-center justify-center mb-2.5">
        {/* Lado esquerdo: mandante + escudo */}
        <div className="flex items-center justify-end flex-1 pr-1">
          <span className="font-semibold text-gray-800 mr-1 text-sm">{match.home_team.name}</span>
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
              <span className="text-xl font-bold text-gray-800">{match.home_score}</span>
              <span className="text-xl font-bold text-gray-800 mx-0.5">×</span>
              <span className="text-xl font-bold text-gray-800">{match.away_score}</span>
            </>
          ) : (
            <span className="text-xl font-bold text-gray-400">×</span>
          )}
        </div>

        {/* Lado direito: escudo + visitante */}
        <div className="flex items-center justify-start flex-1 pl-1">
          <img 
            src={getTeamLogoUrl(match.away_team.logo_url)} 
            alt={match.away_team.name} 
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold text-gray-800 ml-1 text-sm">{match.away_team.name}</span>
        </div>
      </div>
      
      {/* Canais de Transmissão e Links */}
      {((match.broadcasts && match.broadcasts.length > 0) || (match.broadcast_channels)) && (
        <div className="flex flex-wrap gap-2 justify-center">
          {/* Canais de Transmissão (apenas nome clicável) */}
          {match.broadcasts && match.broadcasts.length > 0 && (
            match.broadcasts.map((broadcast: any) => (
              <div key={broadcast.channel.id} className="flex items-center gap-2">
                {broadcast.channel.channel_link ? (
                  <a 
                    href={broadcast.channel.channel_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-200 transition-colors shadow-sm"
                  >
                    {broadcast.channel.name}
                  </a>
                ) : (
                  <span 
                    className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md shadow-sm"
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
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors shadow-sm"
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
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors shadow-sm"
                >
                  ASSISTIR
                </a>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MatchesPage; 