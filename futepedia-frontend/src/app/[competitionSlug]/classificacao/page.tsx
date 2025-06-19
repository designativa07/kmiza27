'use client';

import { useState, useEffect } from 'react';
import { StandingsTable } from '@/components/StandingsTable';
import { RoundMatches } from '@/components/RoundMatches';
import { TournamentBracket } from '@/components/TournamentBracket';
import { Match } from '@/types/match';
import { getApiUrl } from '@/lib/config';
import { getTeamLogoUrl } from '@/lib/cdn-simple';
import { parseISO, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Funções auxiliares para formatação
const formatDate = (dateInput: any) => {
  try {
    if (!dateInput) return '';
    
    if (dateInput instanceof Date) {
      return format(dateInput, 'dd/MM', { locale: ptBR });
    }
    
    if (typeof dateInput === 'string') {
      try {
        const date = parseISO(dateInput);
        if (isValid(date)) {
          return format(date, 'dd/MM', { locale: ptBR });
        }
      } catch {
        const date = new Date(dateInput);
        if (isValid(date)) {
          return format(date, 'dd/MM', { locale: ptBR });
        }
      }
    }
    
    return '';
  } catch {
    return '';
  }
};

const formatTime = (dateInput: any) => {
  try {
    if (!dateInput) return '';
    
    if (dateInput instanceof Date) {
      return format(dateInput, 'HH:mm', { locale: ptBR });
    }
    
    if (typeof dateInput === 'string') {
      try {
        const date = parseISO(dateInput);
        if (isValid(date)) {
          return format(date, 'HH:mm', { locale: ptBR });
        }
      } catch {
        const date = new Date(dateInput);
        if (isValid(date)) {
          return format(date, 'HH:mm', { locale: ptBR });
        }
      }
    }
    
    return '';
  } catch {
    return '';
  }
};

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

export default function ClassificacaoPage({ params }: { params: { competitionSlug: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(0);
  
  // Estado para controlar rodada específica de cada grupo
  const [groupCurrentRound, setGroupCurrentRound] = useState<Record<string, number>>({});

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

        // 2. Buscar classificação
        const standingsResponse = await fetch(`${API_URL}/standings/competition/${competitionData.id}`);
        if (!standingsResponse.ok) {
          throw new Error('Classificação não encontrada');
        }
        const standingsData: Standing[] = await standingsResponse.json();
        setStandings(standingsData);
    
        // 3. Buscar rodadas
        let roundsData: Round[] = [];
        try {
          const roundsResponse = await fetch(`${API_URL}/standings/competition/${competitionData.id}/rounds`);
          if (roundsResponse.ok) {
            roundsData = await roundsResponse.json();
            setRounds(roundsData);
            setTotalRounds(roundsData.length);
            
            // Definir rodada atual como a mais recente (baseado na data mais atual das partidas)
            if (roundsData.length > 0) {
              // Por enquanto, usar a última rodada. Após carregar as partidas, ajustaremos
              setCurrentRound(roundsData[roundsData.length - 1].round_number);
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar rodadas:', err);
        }

        // 4. Buscar partidas de todas as rodadas
        let allMatchesData: Match[] = [];
        if (roundsData.length > 0) {
          for (const round of roundsData) {
            try {
              const roundMatchesResponse = await fetch(`${API_URL}/standings/competition/${competitionData.id}/round/${round.id}/matches`);
              if (roundMatchesResponse.ok) {
                const roundMatches: Match[] = await roundMatchesResponse.json();
                // Adicionar o round_number nas partidas
                roundMatches.forEach(match => {
                  match.round_number = round.round_number;
                });
                allMatchesData.push(...roundMatches);
              }
            } catch (err) {
              console.warn(`Erro ao carregar partidas da rodada ${round.round_number}:`, err);
            }
          }
        }
        setAllMatches(allMatchesData);

        // Após carregar todas as partidas, definir a rodada com a data mais recente
        if (allMatchesData.length > 0 && roundsData.length > 0) {
          try {
            // Agrupar partidas por rodada e encontrar a data mais recente de cada rodada
            const roundDates = roundsData.map(round => {
              const roundMatches = allMatchesData.filter(match => match.round_number === round.round_number);
              
              if (roundMatches.length === 0) {
                return { round_number: round.round_number, latestDate: null };
              }
              
              // Encontrar a data mais recente das partidas desta rodada
              const latestMatch = roundMatches.reduce((latest, match) => {
                if (!match.match_date) return latest;
                if (!latest || !latest.match_date) return match;
                
                const matchDate = new Date(match.match_date);
                const latestDate = new Date(latest.match_date);
                
                return matchDate > latestDate ? match : latest;
              });
              
              return {
                round_number: round.round_number,
                latestDate: latestMatch?.match_date ? new Date(latestMatch.match_date) : null
              };
            });
            
            // Filtrar rodadas que têm partidas e ordenar pela data mais recente
            const roundsWithDates = roundDates
              .filter(rd => rd.latestDate !== null)
              .sort((a, b) => {
                if (!a.latestDate || !b.latestDate) return 0;
                return b.latestDate.getTime() - a.latestDate.getTime();
              });
            
            // Se encontrou rodadas com datas, usar a mais recente
            if (roundsWithDates.length > 0) {
              setCurrentRound(roundsWithDates[0].round_number);
            }
          } catch (dateError) {
            console.warn('Erro ao calcular rodada mais recente:', dateError);
            // Manter a rodada padrão se der erro
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.competitionSlug]);

  // Agrupar classificação por grupos
  const standingsByGroup = standings.reduce((acc, standing) => {
    const groupName = standing.group_name || 'Classificação Geral';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(standing);
    return acc;
  }, {} as Record<string, Standing[]>);

  // Agrupar partidas por grupo também
  const matchesByGroup = allMatches.reduce((acc, match) => {
    const groupName = match.group_name || 'Geral';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Filtrar partidas da rodada atual
  const currentRoundMatches = allMatches.filter(match => {
    // Se existe round_number, usa ele; senão tenta usar outros critérios
    if (match.round_number !== undefined) {
      return match.round_number === currentRound;
    }
    // Fallback: se não tem round_number, mostrar todas as partidas (pode ajustar conforme necessário)
    return true;
  });

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

  // Filtrar partidas de mata-mata
  const knockoutMatches = allMatches.filter(match => {
    // Para competições mata-mata puras, mostrar todas as partidas
    if (competition && isKnockoutCompetition(competition.type)) {
      return match.phase && isKnockoutPhase(match.phase);
    }
    // Para outras competições, filtrar apenas por fase específica
    return match.phase && isKnockoutPhase(match.phase);
  });

  // Verificar se deve mostrar chaveamento
  const shouldShowBracket = knockoutMatches.length > 0 && 
    (competition && (isKnockoutCompetition(competition.type) || knockoutMatches.length > 0));

  // Funções de navegação
  const goToPreviousRound = () => {
    if (currentRound > 1) {
      setCurrentRound(currentRound - 1);
    }
  };

  const goToNextRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound(currentRound + 1);
    }
  };

  // Obter nome da rodada atual
  const getCurrentRoundName = () => {
    const round = rounds.find(r => r.round_number === currentRound);
    return round ? round.name : `${currentRound}ª Rodada`;
  };

  // Função para obter rodada específica de um grupo
  const getGroupRound = (groupName: string) => {
    return groupCurrentRound[groupName] || currentRound;
  };

  // Função para definir rodada específica de um grupo
  const setGroupRound = (groupName: string, round: number) => {
    setGroupCurrentRound(prev => ({
      ...prev,
      [groupName]: round
    }));
  };

  // Função para obter partidas do grupo na rodada específica do grupo
  const getGroupMatches = (groupName: string) => {
    const groupRound = getGroupRound(groupName);
    const groupRoundMatches = allMatches.filter(match => {
      // Filtrar por rodada específica do grupo
      if (match.round_number !== undefined) {
        return match.round_number === groupRound;
      }
      return true;
    });
    
    return groupRoundMatches.filter(match => {
      if (groupName === 'Classificação Geral') {
        return !match.group_name || match.group_name === '' || match.group_name === 'Geral';
      }
      
      return match.group_name === groupName || 
             match.group_name === `Grupo ${groupName}` ||
             match.group_name === groupName.replace('Grupo ', '') ||
             (groupName.startsWith('Grupo ') && match.group_name === groupName.substring(6));
    });
  };

  // Componente de navegação por grupo com pequenos botões
  const GroupMatchHeader = ({ groupName }: { groupName: string }) => {
    const groupMatches = getGroupMatches(groupName);
    const groupRound = getGroupRound(groupName);
    const isPointsCompetition = Object.keys(standingsByGroup).length === 1; // Pontos corridos
    
    const goToPreviousGroupRound = () => {
      if (groupRound > 1) {
        setGroupRound(groupName, groupRound - 1);
      }
    };

    const goToNextGroupRound = () => {
      if (groupRound < totalRounds) {
        setGroupRound(groupName, groupRound + 1);
      }
    };
    
    if (groupMatches.length === 0) {
      return (
        <div className="mb-4">
          {/* Navegação mesmo sem partidas - adapta ao tipo de competição */}
          {isPointsCompetition ? (
            <div className="mb-4 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <button 
                  onClick={goToPreviousGroupRound}
                  disabled={groupRound <= 1}
                  className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="text-center">
                  <h2 className="text-lg font-bold text-gray-800">{getCurrentRoundName()}</h2>
                  <p className="text-xs text-gray-500">Rodada {groupRound} de {totalRounds}</p>
                </div>
                
                <button 
                  onClick={goToNextGroupRound}
                  disabled={groupRound >= totalRounds}
                  className="flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={goToPreviousGroupRound}
                disabled={groupRound <= 1}
                className="flex items-center justify-center w-6 h-6 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-800">
                  RODADA {groupRound}
                </h3>
              </div>
              
              <button 
                onClick={goToNextGroupRound}
                disabled={groupRound >= totalRounds}
                className="flex items-center justify-center w-6 h-6 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="text-center text-gray-500 text-sm">
            Nenhuma partida nesta rodada
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4">
        {/* Navegação maior para pontos corridos, pequena para grupos */}
        {isPointsCompetition ? (
          <div className="mb-4 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <button 
                onClick={goToPreviousGroupRound}
                disabled={groupRound <= 1}
                className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-800">{getCurrentRoundName()}</h2>
                <p className="text-xs text-gray-500">Rodada {groupRound} de {totalRounds}</p>
              </div>
              
              <button 
                onClick={goToNextGroupRound}
                disabled={groupRound >= totalRounds}
                className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={goToPreviousGroupRound}
              disabled={groupRound <= 1}
              className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-800">
                RODADA {groupRound}
              </h3>
            </div>
            
            <button 
              onClick={goToNextGroupRound}
              disabled={groupRound >= totalRounds}
              className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Info das partidas */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {groupMatches.length} partida{groupMatches.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    );
  };

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
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {competition?.name} - Classificação
          </h1>
          <p className="text-gray-600">
            {competition?.season} • {competition?.type}
          </p>
        </div>

        {/* Mostrar chaveamento se for mata-mata */}
        {shouldShowBracket && (
          <div className="mb-8">
            <TournamentBracket 
              matches={knockoutMatches} 
              competitionName={competition?.name}
            />
          </div>
        )}

        {/* Navegação Global de Rodadas (apenas para competições com grupos ou mata-mata) */}
        {rounds.length > 0 && Object.keys(standingsByGroup).length > 1 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={goToPreviousRound}
                disabled={currentRound <= 1}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Rodada Anterior</span>
              </button>
              
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">{getCurrentRoundName()}</h2>
                <p className="text-sm text-gray-500">Rodada {currentRound} de {totalRounds}</p>
              </div>
              
              <button 
                onClick={goToNextRound}
                disabled={currentRound >= totalRounds}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Próxima Rodada</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Seção de Debug (temporária) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Debug Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-yellow-700">Classificação:</h4>
                <ul className="text-yellow-600">
                  {Object.entries(standingsByGroup).map(([group, standings]) => (
                    <li key={group}>{group}: {standings.length} times</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-700">Partidas:</h4>
                <ul className="text-yellow-600">
                  <li>Total: {allMatches.length}</li>
                  <li>Rodada {currentRound}: {currentRoundMatches.length}</li>
                  {Object.entries(matchesByGroup).map(([group, matches]) => (
                    <li key={group}>{group}: {matches.length} partidas</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3">
              <h4 className="font-semibold text-yellow-700">Exemplo de partidas da rodada atual:</h4>
              <div className="text-yellow-600 text-xs">
                {currentRoundMatches.slice(0, 3).map(match => (
                  <div key={match.id}>
                    {match.home_team?.name} vs {match.away_team?.name} 
                    (Grupo: {match.group_name || 'Nenhum'}, Rodada: {match.round_number || 'N/A'})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo baseado no tipo de competição */}
        {Object.keys(standingsByGroup).length > 1 ? (
          // Layout para competições com grupos
          <div className="space-y-8">
            {Object.entries(standingsByGroup).map(([groupName, groupStandings]) => (
              <div key={groupName} className="bg-white rounded-lg overflow-hidden">
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
                    <GroupMatchHeader groupName={groupName} />
                    <RoundMatches 
                      matches={getGroupMatches(groupName)}
                      roundName={getCurrentRoundName()}
                      hideTitle={true}
                    />
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
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Classificação</h2>
                <StandingsTable standings={standings} />
              </div>
            </div>
            
            {/* Jogos da rodada atual */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6">
                <GroupMatchHeader groupName="Classificação Geral" />
                <RoundMatches 
                  matches={getGroupMatches('Classificação Geral')}
                  roundName={getCurrentRoundName()}
                  hideTitle={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Seção adicional para estatísticas se não for mata-mata */}
        {!shouldShowBracket && (
          <div className="mt-8 bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Estatísticas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{standings.length}</div>
                <div className="text-sm text-gray-600">Times</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{totalRounds}</div>
                <div className="text-sm text-gray-600">Rodadas</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{allMatches.length}</div>
                <div className="text-sm text-gray-600">Partidas</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}