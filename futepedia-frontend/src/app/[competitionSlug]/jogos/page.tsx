'use client';

import Link from 'next/link';
import type { NextPage } from 'next';
import { getTeamLogoUrl } from '@/lib/cdn';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RoundNavigator } from '@/components/RoundNavigator';
import { createKnockoutTies, isKnockoutCompetition, shouldShowBracket } from '@/lib/competition-utils';
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

  // 2. Buscar as rodadas da competição
  let roundsData: Round[] = [];
  try {
    const roundsResponse = await fetch(`${API_URL}/standings/competition/${competition.id}/rounds`, { cache: 'no-store' });
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
    router.push(`/${competitionSlug}/jogos?roundId=${roundId}`);
  };

  // Filtrar as partidas pela rodada selecionada (se houver)
  const filteredMatches = currentRoundId 
    ? matches.filter(match => match.round?.id === currentRoundId) 
    : matches;

  // Verificar se é competição de mata-mata
  // Forçar mata-mata se houver partidas com tie_id, leg, ou se é uma rodada específica
  const hasKnockoutMatches = filteredMatches.some(match => 
    match.phase || 
    (match as any).tie_id || 
    (match as any).leg
  );
  
  // Forçar mata-mata se é uma rodada específica (como Rodada 7)
  const isSpecificKnockoutRound = currentRoundNumber && currentRoundNumber >= 7;
  
  const isKnockout = competition && (
    isKnockoutCompetition(competition.type) || 
    shouldShowBracket(filteredMatches, competition) ||
    hasKnockoutMatches ||
    isSpecificKnockoutRound
  );
  
  // Criar confrontos de mata-mata se necessário
  const knockoutTies = isKnockout ? createKnockoutTies(filteredMatches) : [];

  // Debug: mostrar informações no console
  console.log('Current round number:', currentRoundNumber);
  console.log('Filtered matches:', filteredMatches);
  console.log('Has knockout matches:', hasKnockoutMatches);
  console.log('Is specific knockout round:', isSpecificKnockoutRound);
  console.log('Is knockout:', isKnockout);
  console.log('Knockout ties:', knockoutTies);

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
          <div className="px-4 pb-4">
            {isKnockout && knockoutTies.length > 0 ? (
              /* Formato de Mata-mata Simples */
              <div className="space-y-4">
                {knockoutTies.map(tie => (
                  <KnockoutTieCard 
                    key={tie.id} 
                    tie={tie} 
                    formatDate={formatDate} 
                    getTeamLogoUrl={getTeamLogoUrl} 
                  />
                ))}
              </div>
            ) : filteredMatches.length > 0 ? (
              /* Formato de Lista tradicional */
              filteredMatches.map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  formatDate={formatDate} 
                  getTeamLogoUrl={getTeamLogoUrl} 
                />
              ))
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

// Componente para confrontos de mata-mata (formato simples)
interface KnockoutTieCardProps {
  tie: any;
  formatDate: (dateString: string) => string;
  getTeamLogoUrl: (logoUrl: string) => string;
}

const KnockoutTieCard: React.FC<KnockoutTieCardProps> = ({ tie, formatDate, getTeamLogoUrl }) => {
  const isFinished = tie.status === 'FINISHED';
  const winner = tie.winner_team;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      {/* Cabeçalho da fase */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{tie.phase}</h3>
      </div>

      {/* Confronto lado a lado - formato do painel administrativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jogo de Ida */}
        <div className="text-center">
          <div className="text-blue-600 font-semibold text-sm mb-2">JOGO DE IDA</div>
          <div className="text-xs text-gray-500 mb-3">
            {formatDate(tie.leg1.match_date)}
            {tie.leg1.stadium && (
              <div>{tie.leg1.stadium.name}</div>
            )}
          </div>
          
          {/* Confronto visual */}
          <div className="flex items-center justify-center space-x-3">
            {/* Time da casa */}
            <div className="flex items-center space-x-2">
              <img 
                src={getTeamLogoUrl(tie.home_team.logo_url)} 
                alt={tie.home_team.name} 
                className="h-8 w-8 object-contain"
              />
              <span className="text-sm font-medium">{tie.home_team.name.length > 10 ? tie.home_team.name.substring(0, 10) + '...' : tie.home_team.name}</span>
            </div>

            {/* Placar */}
            <div className="bg-gray-100 px-3 py-1 rounded-md min-w-[60px]">
              <span className="text-lg font-bold text-gray-800">
                {tie.leg1.home_score !== undefined ? tie.leg1.home_score : '-'}
              </span>
              <span className="text-lg font-bold text-gray-800 mx-1">:</span>
              <span className="text-lg font-bold text-gray-800">
                {tie.leg1.away_score !== undefined ? tie.leg1.away_score : '-'}
              </span>
            </div>

            {/* Time visitante */}
            <div className="flex items-center space-x-2">
              <img 
                src={getTeamLogoUrl(tie.away_team.logo_url)} 
                alt={tie.away_team.name} 
                className="h-8 w-8 object-contain"
              />
              <span className="text-sm font-medium">{tie.away_team.name.length > 10 ? tie.away_team.name.substring(0, 10) + '...' : tie.away_team.name}</span>
            </div>
          </div>
        </div>

        {/* Jogo de Volta */}
        {tie.leg2 && (
          <div className="text-center">
            <div className="text-blue-600 font-semibold text-sm mb-2">JOGO DE VOLTA</div>
            <div className="text-xs text-gray-500 mb-3">
              {formatDate(tie.leg2.match_date)}
              {tie.leg2.stadium && (
                <div>{tie.leg2.stadium.name}</div>
              )}
            </div>
            
            {/* Confronto visual */}
            <div className="flex items-center justify-center space-x-3">
              {/* Time da casa */}
              <div className="flex items-center space-x-2">
                <img 
                  src={getTeamLogoUrl(tie.leg2.home_team.logo_url)} 
                  alt={tie.leg2.home_team.name} 
                  className="h-8 w-8 object-contain"
                />
                <span className="text-sm font-medium">{tie.leg2.home_team.name.length > 10 ? tie.leg2.home_team.name.substring(0, 10) + '...' : tie.leg2.home_team.name}</span>
              </div>

              {/* Placar */}
              <div className="bg-gray-100 px-3 py-1 rounded-md min-w-[60px]">
                <span className="text-lg font-bold text-gray-800">
                  {tie.leg2.home_score !== undefined ? tie.leg2.home_score : '-'}
                </span>
                <span className="text-lg font-bold text-gray-800 mx-1">:</span>
                <span className="text-lg font-bold text-gray-800">
                  {tie.leg2.away_score !== undefined ? tie.leg2.away_score : '-'}
                </span>
              </div>

              {/* Time visitante */}
              <div className="flex items-center space-x-2">
                <img 
                  src={getTeamLogoUrl(tie.leg2.away_team.logo_url)} 
                  alt={tie.leg2.away_team.name} 
                  className="h-8 w-8 object-contain"
                />
                <span className="text-sm font-medium">{tie.leg2.away_team.name.length > 10 ? tie.leg2.away_team.name.substring(0, 10) + '...' : tie.leg2.away_team.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resultado final */}
      {isFinished && winner && (
        <div className="text-center mt-4 pt-3 border-t border-gray-200">
          <div className="text-blue-600 font-semibold text-sm mb-2">
            Classificado: {winner.name}
          </div>
          {(tie.aggregate_home_score !== undefined && tie.aggregate_away_score !== undefined) && (
            <div className="text-sm text-gray-600">
              Agregado: {tie.aggregate_home_score} × {tie.aggregate_away_score}
            </div>
          )}
        </div>
      )}
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
    <div className="py-4 border-b border-gray-200 last:border-b-0">
      <div className="text-center text-sm text-gray-600 mb-3">
        <span>{formatDate(match.match_date)}</span>
        {match.stadium && (
          <span className="ml-2">
            • {match.stadium.name}
            {match.stadium.city && ` (${match.stadium.city})`}
          </span>
        )}
      </div>
      <div className="flex items-center justify-center mb-3">
        {/* Lado esquerdo: mandante + escudo */}
        <div className="flex items-center justify-end flex-1 pr-1">
          <span className="font-semibold text-gray-800 mr-1">{match.home_team.name}</span>
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
          <span className="font-semibold text-gray-800 ml-1">{match.away_team.name}</span>
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