'use client';

import Link from 'next/link';
import type { NextPage } from 'next';
import { getTeamLogoUrl } from '@/lib/cdn';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Importar useRouter e useSearchParams de next/navigation
import { RoundNavigator } from '@/components/RoundNavigator'; // Importar RoundNavigator

// Interfaces
interface Competition {
  id: number;
  name: string;
  slug: string;
  type: string; // Adicionado para identificar o tipo da competição (mata-mata, grupos)
}

interface Match {
  id: number;
  match_date: string;
  round: {
    id: number;
    name: string;
    round_number: number;
  } | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
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
  stadium: {
    id: number;
    name: string;
    city?: string; // Adicionado
  } | null;
  broadcasts?: {
    channel: {
      id: number;
      name: string;
      channel_link: string;
    };
  }[];
  broadcast_channels?: string[] | string;
  group_name?: string; // Adicionado para agrupar por grupo
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
            match.round = { // Garante que match.round é um objeto com nome e número
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
  const router = useRouter(); // Inicializar useRouter
  const searchParams = useSearchParams(); // Inicializar useSearchParams

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
  }, [competitionSlug]); // Dependência: competitionSlug

  // Estado para a rodada atualmente selecionada (movido para fora do useEffect)
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number | null>(null);

  // Lógica para navegação de rodadas
  const handleRoundChange = (roundId: number, roundNumber: number) => {
    setCurrentRoundId(roundId);
    setCurrentRoundNumber(roundNumber);
    router.push(`/${competitionSlug}/jogos?roundId=${roundId}`); // Simplificado: apenas a URL
  };

  // Filtrar as partidas pela rodada selecionada (se houver)
  const matchesForSelectedRound = currentRoundId 
    ? matches.filter(match => match.round?.id === currentRoundId) 
    : matches; // Se não houver rodada selecionada, mostrar todas (ou a lógica que desejar)

  // Agrupar jogos por rodada e encontrar a data mais recente de cada rodada
  const matchesByRound = matchesForSelectedRound.reduce((acc, match) => {
    const roundId = match.round?.id || 0; // Usar ID da rodada como chave
    const roundName = match.round?.name || 'Sem rodada';
    const roundNumber = match.round?.round_number || 0;
    const groupName = match.group_name || 'Geral'; // Obter o nome do grupo

    if (!acc[roundId]) {
      acc[roundId] = { 
        roundData: { id: roundId, name: roundName, round_number: roundNumber },
        groups: {}, // Mudar para objeto de grupos
        latestMatchDate: null as Date | null // Adiciona campo para a data da partida mais recente
      };
    }

    if (!acc[roundId].groups[groupName]) {
      acc[roundId].groups[groupName] = [];
    }
    acc[roundId].groups[groupName].push(match);

    // Atualiza a data da partida mais recente para a rodada
    if (match.match_date) {
      const currentMatchDate = new Date(match.match_date);
      if (!acc[roundId].latestMatchDate || currentMatchDate > acc[roundId].latestMatchDate) {
        acc[roundId].latestMatchDate = currentMatchDate;
      }
    }
    return acc;
  }, {} as Record<number, { roundData: Round, groups: Record<string, Match[]>, latestMatchDate: Date | null }>); // Chave por ID da rodada e agora com grupos

  // Ordenar as rodadas: primeiro pela data da partida mais recente (decrescente), depois pelo número da rodada (decrescente)
  const sortedRoundEntries = Object.values(matchesByRound).sort((a, b) => {
    // Priorizar rodadas com datas mais recentes
    if (a.latestMatchDate && b.latestMatchDate) {
      if (b.latestMatchDate.getTime() !== a.latestMatchDate.getTime()) {
        return b.latestMatchDate.getTime() - a.latestMatchDate.getTime();
      }
    } else if (a.latestMatchDate) { // A tem data, B não
      return -1;
    } else if (b.latestMatchDate) { // B tem data, A não
      return 1;
    }

    // Fallback: ordenar pelo round_number (decrescente, para mostrar mais atual primeiro)
    return b.roundData.round_number - a.roundData.round_number;
  });

  // Encontrar a rodada selecionada
  const selectedRoundEntry = currentRoundId 
    ? sortedRoundEntries.find(entry => entry.roundData.id === currentRoundId) 
    : sortedRoundEntries[0]; // Padrão para a primeira rodada se nenhuma for selecionada

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
      <header className="mb-4">
        <Link href="/" className="text-indigo-600 hover:underline">&larr; Voltar para todos os campeonatos</Link>
        <h1 className="text-3xl font-bold mt-2">Jogos - {competition.name}</h1>
      </header>

      {/* Container unificado: Navegação + Jogos */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        {/* Navegação de Rodadas */}
        {currentRoundId && currentRoundNumber && (rounds.length > 1 || competition.type === 'mata-mata') && (
          <RoundNavigator
            competitionType={competition.type}
            rounds={rounds.filter(round => typeof round.round_number === 'number')}
            currentRoundId={currentRoundId}
            currentRoundNumber={currentRoundNumber}
            onRoundChange={handleRoundChange}
          />
        )}

        {/* Conteúdo dos Jogos */}
        {selectedRoundEntry && Object.keys(selectedRoundEntry.groups).length > 0 ? (
          <div key={selectedRoundEntry.roundData.id} className="p-6 space-y-4">
            {competition && (competition.type === 'groups' || competition.type === 'grupos_e_mata_mata') ? (
              // Renderizar por grupos para competições tipo 'groups' ou 'grupos_e_mata_mata'
              Object.entries(selectedRoundEntry.groups)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([groupName, groupMatches]) => (
                  <div key={groupName} className="mb-6 last:mb-0">
                    <h3 className="text-xl font-bold text-blue-800 mb-4 bg-blue-50 py-3 px-4 rounded-lg text-center">
                      {groupName === 'Geral' ? 'Partidas' : `Grupo ${groupName}`}
                    </h3>
                    <div className="space-y-4">
                      {groupMatches.map((match) => (
                        <MatchCard key={match.id} match={match} formatDate={formatDate} getTeamLogoUrl={getTeamLogoUrl} />
                      ))}
                    </div>
                  </div>
                ))
            ) : (
              // Renderizar sem agrupamento para outras competições ou se não houver grupos
              Object.values(selectedRoundEntry.groups).flat().map((match) => (
                <MatchCard key={match.id} match={match} formatDate={formatDate} getTeamLogoUrl={getTeamLogoUrl} />
              ))
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Sem partidas para a rodada selecionada.</p>
          </div>
        )}
      </div>
    </main>
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
    <div className="bg-gray-50 p-4 rounded-lg border hover:border-indigo-500 transition-all">
      <div className="text-center text-sm text-gray-600 mb-3">
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
          <span className="font-semibold text-gray-800 mr-1">{match.home_team.name}</span>
          <img 
            src={getTeamLogoUrl(match.home_team.logo_url)} 
            alt={match.home_team.name} 
            className="h-8 w-8 object-contain"
          />
        </div>

        {/* Centro: placar fixo */}
        <div className="flex items-center justify-center min-w-[60px]">
          {(match.status === 'COMPLETED' || match.status === 'finished' || match.status === 'FINISHED' || (match.home_score !== null && match.away_score !== null)) ? (
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
      {/* Canais de Transmissão e Links Adicionais Consolidados */}
      {( (match.broadcasts && match.broadcasts.length > 0) || (match.broadcast_channels)) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-center">
          {/* Canais de Transmissão (apenas nome clicável) */}
          {match.broadcasts && match.broadcasts.length > 0 && (
            match.broadcasts.map((broadcast) => (
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
                match.broadcast_channels.split(',').map((link, index) => {
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
              match.broadcast_channels.map((link, index) => {
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