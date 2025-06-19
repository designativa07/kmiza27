import type { NextPage } from 'next';
import { ShieldCheck, ArrowDown, ArrowUp } from 'lucide-react';
import { RoundMatches } from '@/components/RoundMatches';
import { Match } from '@/types/match';
import Link from 'next/link';
import { StandingsTable } from '@/components/StandingsTable';
import { RoundNavigator } from '@/components/RoundNavigator';
import ClientOnly from '@/components/ClientOnly';
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

// Tipos de dados
interface Competition {
  id: number;
  name: string;
  slug: string;
  goal_difference: number;
  form?: string;
  group_name?: string;
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

// Definir um tipo para as props da página
type Props = {
  params: { competitionSlug: string };
};

async function getClassificationPageData(slug: string) {
  const API_URL = getApiUrl();
  
  try {
    console.log('🔍 Buscando dados da classificação para:', slug);
    console.log('🌐 URL da API:', API_URL);
    
    // 1. Obter ID da competição
    const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { 
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!competitionResponse.ok) {
      console.error('❌ Erro ao buscar competição:', competitionResponse.status);
      throw new Error(`Competição não encontrada: ${competitionResponse.status}`);
    }
    
    const competition: { id: number; name: string } = await competitionResponse.json();
    console.log('✅ Competição encontrada:', competition);
    const competitionId = competition.id;

    // 2. Fazer chamadas em paralelo com tratamento robusto
    console.log('🔍 Buscando classificação e rodadas para competição ID:', competitionId);
    
    const [standingsResponse, roundsResponse, currentRoundResponse] = await Promise.all([
      fetch(`${API_URL}/standings/competition/${competitionId}`, { 
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${API_URL}/standings/competition/${competitionId}/rounds`, { 
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => {
        console.warn('⚠️ Erro ao buscar rodadas:', err);
        return { ok: false };
      }),
      fetch(`${API_URL}/standings/competition/${competitionId}/current-round`, { 
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => {
        console.warn('⚠️ Erro ao buscar rodada atual:', err);
        return { ok: false };
      })
    ]);

    if (!standingsResponse.ok) {
      console.error('❌ Erro ao buscar classificação:', standingsResponse.status);
      throw new Error(`Tabela de classificação indisponível: ${standingsResponse.status}`);
    }
    
    const standings: Standing[] = await standingsResponse.json();
    console.log('✅ Classificação carregada:', standings.length, 'times');
    
    // Processar rodadas com tratamento robusto
    let rounds: Round[] = [];
    let currentRound: Round | null = null;
    
    if (roundsResponse.ok && 'json' in roundsResponse) {
      try {
        rounds = await roundsResponse.json();
        console.log('✅ Rodadas carregadas:', rounds.length);
      } catch (err) {
        console.warn('⚠️ Erro ao processar rodadas:', err);
        rounds = [];
      }
    }
    
    if (currentRoundResponse.ok && 'text' in currentRoundResponse) {
      try {
        const currentRoundText = await currentRoundResponse.text();
        if (currentRoundText && currentRoundText.trim() !== '') {
          currentRound = JSON.parse(currentRoundText);
          console.log('✅ Rodada atual encontrada:', currentRound);
        } else {
          console.log('ℹ️ Nenhuma rodada atual definida');
        }
      } catch (err) {
        console.warn('⚠️ Erro ao processar rodada atual:', err);
        currentRound = null;
      }
    }

    // Determinar rodada inicial e partidas
    let initialMatches: Match[] = [];
    let initialRoundId: number | null = null;
    let initialRoundName: string = 'Rodada';

    if (currentRound) {
      initialRoundId = currentRound.id;
      initialRoundName = currentRound.name;
      try {
        const matchesResponse = await fetch(`${API_URL}/standings/competition/${competitionId}/round/${currentRound.id}/matches`, { 
          next: { revalidate: 60 },
          headers: { 'Content-Type': 'application/json' }
        });
        if (matchesResponse.ok) {
          initialMatches = await matchesResponse.json();
          console.log('✅ Partidas da rodada atual carregadas:', initialMatches.length);
        }
      } catch (err) {
        console.warn('⚠️ Erro ao buscar partidas da rodada atual:', err);
      }
    } else if (rounds && rounds.length > 0) {
      // Fallback: se não houver rodada atual, pega a última rodada da lista
      const latestRound = rounds[rounds.length - 1];
      initialRoundId = latestRound.id;
      initialRoundName = latestRound.name;
      console.log('ℹ️ Usando última rodada como fallback:', latestRound);
      try {
        const matchesResponse = await fetch(`${API_URL}/standings/competition/${competitionId}/round/${latestRound.id}/matches`, { 
          next: { revalidate: 60 },
          headers: { 'Content-Type': 'application/json' }
        });
        if (matchesResponse.ok) {
          initialMatches = await matchesResponse.json();
          console.log('✅ Partidas da última rodada carregadas:', initialMatches.length);
        }
      } catch (err) {
        console.warn('⚠️ Erro ao buscar partidas da última rodada:', err);
      }
    }

    return { standings, initialMatches, rounds, competitionId, initialRoundId, initialRoundName };
  } catch (error) {
    console.error('💥 Erro ao buscar dados da classificação:', error);
    throw error;
  }
}

// O componente da página agora usa o tipo 'NextPage' com as nossas Props
const ClassificationPage: NextPage<Props> = async ({ params }) => {
  try {
    console.log('🚀 Iniciando página de classificação para:', params.competitionSlug);
    const { standings, initialMatches, rounds, competitionId, initialRoundId, initialRoundName } = await getClassificationPageData(params.competitionSlug);

    const groupedStandings = standings.reduce((acc, s) => {
      const groupName = s.group_name || 'Classificação Geral';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(s);
      return acc;
    }, {} as Record<string, typeof standings>);

    // Agrupar partidas por grupo também
    const groupedMatches = initialMatches.reduce((acc, match) => {
      const groupName = match.group_name || 'Geral';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    const hasGroups = Object.keys(groupedStandings).length > 1;

    console.log('✅ Página de classificação renderizada com sucesso');

    return (
      <div className="space-y-6">
        {standings.length > 0 ? (
          hasGroups ? (
            // Layout para competições com grupos: cada grupo com sua classificação e jogos lado a lado
            <div className="space-y-8">
              {Object.entries(groupedStandings).map(([groupName, groupStandings]) => {
                const groupMatches = groupedMatches[groupName === 'Classificação Geral' ? 'Geral' : groupName] || [];
                
                return (
                  <div key={groupName} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Cabeçalho do Grupo */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                      <h2 className="text-xl font-bold">{groupName}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
                      {/* Classificação do Grupo (2/3) */}
                      <div className="xl:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Classificação</h3>
                        <StandingsTable standings={groupStandings} />
                      </div>
                      
                      {/* Jogos do Grupo (1/3) */}
                      <div className="xl:col-span-1">
                        {/* Cabeçalho com navegação de rodadas */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {groupName === 'Classificação Geral' ? 'Partidas' : groupName}
                          </h3>
                        </div>
                        
                        {/* Navegação de rodadas compacta */}
                        <div className="bg-gray-100 rounded-lg p-2 mb-4 flex items-center justify-between">
                          <button 
                            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={true}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-sm font-medium text-gray-700">
                            {initialRoundName}
                          </span>
                          <button 
                            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={true}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Jogos do grupo sem título adicional */}
                        {groupMatches.length > 0 ? (
                          <div className="space-y-3">
                            {groupMatches.map((match) => (
                              <div key={match.id} className="bg-white rounded-lg p-3 shadow-sm border">
                                {/* Linha principal: Times e Placar/Horário */}
                                <div className="grid grid-cols-3 items-center gap-2 mb-2">
                                  {/* Time da Casa */}
                                  <div className="flex items-center justify-end space-x-2">
                                    <span className="text-xs font-semibold text-gray-700 text-right truncate">{match.home_team.name}</span>
                                    <img 
                                      src={getTeamLogoUrl(match.home_team.logo_url)}
                                      alt={match.home_team.name} 
                                      className="h-6 w-6 object-contain flex-shrink-0"
                                    />
                                  </div>

                                  {/* Placar/Horário e X */}
                                  <div className="text-center">
                                    {(match.status === 'FINISHED' || match.status === 'finished') ? (
                                      <div>
                                        <div className="text-lg font-bold text-gray-900 mb-1">
                                          <span>{match.home_score}</span>
                                          <span className="mx-1 text-gray-400">×</span>
                                          <span>{match.away_score}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          <div>{formatDate(match.match_date)}</div>
                                          <div>{formatTime(match.match_date)}</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="text-lg font-bold text-gray-400 mb-1">×</div>
                                        <div className="text-xs text-gray-500">
                                          <div>{formatDate(match.match_date)}</div>
                                          <div>{formatTime(match.match_date)}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Time Visitante */}
                                  <div className="flex items-center space-x-2">
                                    <img 
                                      src={getTeamLogoUrl(match.away_team.logo_url)}
                                      alt={match.away_team.name} 
                                      className="h-6 w-6 object-contain flex-shrink-0"
                                    />
                                    <span className="text-xs font-semibold text-gray-700 truncate">{match.away_team.name}</span>
                                  </div>
                                </div>

                                {/* Informações adicionais compactas */}
                                {(match.stadium || match.broadcast_channels) && (
                                  <div className="text-xs text-gray-500 text-center space-y-1">
                                    {match.stadium && (
                                      <div className="truncate">{match.stadium.name}</div>
                                    )}
                                    {match.broadcast_channels && (
                                      <div className="truncate">
                                        {Array.isArray(match.broadcast_channels) 
                                          ? match.broadcast_channels.join(', ')
                                          : match.broadcast_channels
                                        }
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                            Nenhuma partida nesta rodada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Layout para competições sem grupos: layout tradicional
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna da Tabela de Classificação (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                <StandingsTable standings={standings} />
              </div>

              {/* Coluna das Partidas da Rodada (1/3) */}
              <div className="lg:col-span-1">
                <ClientOnly fallback={
                  <div className="bg-white rounded-lg shadow-lg p-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                }>
                  <RoundNavigator 
                    initialRounds={rounds}
                    competitionId={competitionId}
                    initialMatches={initialMatches}
                    initialRoundId={initialRoundId}
                    initialRoundName={initialRoundName}
                  />
                </ClientOnly>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-lg text-center py-16">
            <h3 className="text-xl font-medium text-gray-900">Tabela Indisponível</h3>
            <p className="mt-2 text-md text-gray-500">
              Ainda não há dados de classificação para este campeonato.
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('💥 Erro na página de classificação:', error);
    return (
      <div className="bg-white rounded-lg shadow-lg text-center py-16">
        <h3 className="text-xl font-medium text-gray-900">Erro ao Carregar Classificação</h3>
        <p className="mt-2 text-md text-gray-500">
          Não foi possível carregar os dados da classificação. Tente novamente mais tarde.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Erro: {error instanceof Error ? error.message : 'Erro desconhecido'}
        </p>
      </div>
    );
  }
};

export default ClassificationPage; 