'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Home, MapPin, Trophy, AlertTriangle, Users, Target, Zap } from 'lucide-react';
import { TeamComparison } from './TeamComparison';

interface TeamStatisticsData {
  team: {
    id: number;
    name: string;
    logo_url: string;
  };
  matches: {
    total: number;
    finished: number;
    scheduled: number;
    home: {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
    };
    away: {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
    };
  };
  totals: {
    points: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
  };
}

interface DifficultyAnalysis {
  team: { id: number; name: string };
  analysis: Array<RoundRobinAnalysis | KnockoutAnalysis>;
}

interface RoundRobinAnalysis {
  analysisType: 'round-robin';
  competition: { id: number; name: string };
  remainingMatches: number;
  homeGames: number;
  awayGames: number;
  strongOpponents: number;
  difficultOpponents: number;
  mediumOpponents: number;
  weakOpponents: number;
  averageOpponentPosition: number;
  difficultyScore: number;
  difficultyLevel: string;
}

interface KnockoutAnalysis {
  analysisType: 'knockout';
  competition: { id: number; name: string };
  roundName: string;
  nextOpponent: {
    id: number;
    name: string;
    logo_url: string;
    position: number;
    positionContext: string;
  };
  isHome: boolean;
  difficultyScore: number;
  difficultyLevel: string;
}

interface TitleChances {
  // Formato antigo (fallback)
  team?: {
    id: number;
    name: string;
  };
  titleChances?: Array<{
    competition: {
      id: number;
      name: string;
      type: string;
    };
    currentPosition: number;
    currentPoints: number;
    pointsGap: number;
    gamesRemaining: number;
    titleChance: number;
    analysis: {
      canWin: boolean;
      needsHelp: boolean;
      criticalGames: boolean;
    };
  }>;
  
  // Formato novo (simulação)
  simulation_based?: boolean;
  execution_date?: string;
  title_probability?: number;
  current_position?: number;
  competition?: {
    id: number;
    name: string;
  };
  analysis?: {
    canWin: boolean;
    likely: boolean;
    favorite: boolean;
  };
  advanced_stats?: {
    top4_probability: number;
    average_final_position: number;
    average_final_points: number;
  };
}

interface RelegationRisk {
  // Formato antigo (fallback)
  team?: {
    id: number;
    name: string;
  };
  relegationRisks?: Array<{
    competition: {
      id: number;
      name: string;
      type: string;
    };
    currentPosition: number;
    currentPoints: number;
    pointsGap: number;
    gamesRemaining: number;
    relegationRisk: number;
    analysis: {
      inDanger: boolean;
      needsPoints: boolean;
      criticalPosition: boolean;
    };
  }>;
  
  // Formato novo (simulação)
  simulation_based?: boolean;
  execution_date?: string;
  relegation_probability?: number;
  current_position?: number;
  competition?: {
    id: number;
    name: string;
  };
  analysis?: {
    inDanger: boolean;
    highRisk: boolean;
    criticalSituation: boolean;
  };
  advanced_stats?: {
    average_final_position: number;
    average_final_points: number;
    top6_probability: number;
  };
}

interface TeamComparison {
  team1: {
    id: number;
    name: string;
    logo_url: string;
    averageDifficulty: number;
  };
  team2: {
    id: number;
    name: string;
    logo_url: string;
    averageDifficulty: number;
  };
  comparison: {
    difficultyDifference: number;
    easierSchedule: 'team1' | 'team2' | 'equal';
    advantage: number;
    analysis: {
      team1: any[];
      team2: any[];
    };
  };
}

interface TeamStatisticsProps {
  teamId: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function TeamStatistics({ teamId }: TeamStatisticsProps) {
  const [statistics, setStatistics] = useState<TeamStatisticsData | null>(null);
  const [difficultyAnalysis, setDifficultyAnalysis] = useState<DifficultyAnalysis | null>(null);
  const [titleChances, setTitleChances] = useState<TitleChances | null>(null);
  const [relegationRisk, setRelegationRisk] = useState<RelegationRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Usar o endpoint unified que retorna todos os dados de uma vez
        const response = await fetch(`${API_URL}/teams/${teamId}/advanced-stats`);

        if (!response.ok) {
          throw new Error('Erro ao carregar estatísticas');
        }

        const data = await response.json();

        setStatistics(data.statistics);
        setDifficultyAnalysis(data.difficultyAnalysis);
        setTitleChances(data.titleChances);
        setRelegationRisk(data.relegationRisk);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Carregando estatísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar estatísticas</h3>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!statistics || !difficultyAnalysis || !titleChances || !relegationRisk) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma estatística disponível</p>
      </div>
    );
  }

  const getDifficultyColor = (score: number) => {
    if (score <= 25) return 'text-green-600 bg-green-100';
    if (score <= 45) return 'text-blue-600 bg-blue-100';
    if (score <= 65) return 'text-yellow-600 bg-yellow-100';
    if (score <= 85) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getDifficultyIcon = (score: number) => {
    if (score <= 25) return <TrendingDown className="h-4 w-4" />;
    if (score <= 45) return <TrendingDown className="h-4 w-4" />;
    if (score <= 65) return <Target className="h-4 w-4" />;
    if (score <= 85) return <TrendingUp className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
          Resumo Geral da Temporada
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {/* Linha 1: Campanha */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{statistics.matches.finished}</div>
            <div className="text-sm text-gray-600 mt-1">Jogos Disputados</div>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="text-3xl font-bold text-indigo-600">{statistics.totals.won}</div>
            <div className="text-sm text-gray-600 mt-1">Vitórias</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-600">{statistics.totals.drawn}</div>
            <div className="text-sm text-gray-600 mt-1">Empates</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{statistics.totals.lost}</div>
            <div className="text-sm text-gray-600 mt-1">Derrotas</div>
          </div>
          
          {/* Linha 2: Gols e Futuro */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{statistics.matches.scheduled}</div>
            <div className="text-sm text-gray-600 mt-1">Jogos Restantes</div>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg">
            <div className="text-3xl font-bold text-teal-600">+{statistics.totals.goalsFor}</div>
            <div className="text-sm text-gray-600 mt-1">Gols Marcados</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">-{statistics.totals.goalsAgainst}</div>
            <div className="text-sm text-gray-600 mt-1">Gols Sofridos</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">
              {statistics.totals.goalDifference > 0 ? `+${statistics.totals.goalDifference}` : statistics.totals.goalDifference}
            </div>
            <div className="text-sm text-gray-600 mt-1">Saldo de Gols</div>
          </div>
        </div>
      </div>

      {/* Estatísticas Casa e Fora */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Em Casa */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Home className="h-5 w-5 mr-2 text-green-600" />
            Desempenho em Casa
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Jogos Disputados</span>
              <span className="font-bold text-lg">{statistics.matches.home.played}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Campanha</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 my-1 flex overflow-hidden">
              <div 
                className="bg-green-500 h-4" 
                style={{ width: `${statistics.matches.home.played > 0 ? (statistics.matches.home.won / statistics.matches.home.played) * 100 : 0}%` }}
                title={`Vitórias: ${statistics.matches.home.won}`}
              ></div>
              <div 
                className="bg-gray-400 h-4" 
                style={{ width: `${statistics.matches.home.played > 0 ? (statistics.matches.home.drawn / statistics.matches.home.played) * 100 : 0}%` }}
                title={`Empates: ${statistics.matches.home.drawn}`}
              ></div>
              <div 
                className="bg-red-500 h-4" 
                style={{ width: `${statistics.matches.home.played > 0 ? (statistics.matches.home.lost / statistics.matches.home.played) * 100 : 0}%` }}
                title={`Derrotas: ${statistics.matches.home.lost}`}
              ></div>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span className="text-green-600">VIT ({statistics.matches.home.won})</span>
              <span className="text-gray-500">EMP ({statistics.matches.home.drawn})</span>
              <span className="text-red-600">DER ({statistics.matches.home.lost})</span>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-600">Gols</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 my-1 flex overflow-hidden">
              <div 
                className="bg-green-500 h-4" 
                style={{ width: `${(statistics.matches.home.goalsFor + statistics.matches.home.goalsAgainst) > 0 ? (statistics.matches.home.goalsFor / (statistics.matches.home.goalsFor + statistics.matches.home.goalsAgainst)) * 100 : 0}%` }}
                title={`Gols Marcados: ${statistics.matches.home.goalsFor}`}
              ></div>
              <div 
                className="bg-red-500 h-4" 
                style={{ width: `${(statistics.matches.home.goalsFor + statistics.matches.home.goalsAgainst) > 0 ? (statistics.matches.home.goalsAgainst / (statistics.matches.home.goalsFor + statistics.matches.home.goalsAgainst)) * 100 : 0}%` }}
                title={`Gols Sofridos: ${statistics.matches.home.goalsAgainst}`}
              ></div>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span className="text-green-600">Marcados (+{statistics.matches.home.goalsFor})</span>
              <span className="text-red-600">Sofridos (-{statistics.matches.home.goalsAgainst})</span>
            </div>
          </div>
        </div>

        {/* Card Fora */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Desempenho Fora
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Jogos Disputados</span>
              <span className="font-bold text-lg">{statistics.matches.away.played}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Campanha</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 my-1 flex overflow-hidden">
              <div 
                className="bg-green-500 h-4" 
                style={{ width: `${statistics.matches.away.played > 0 ? (statistics.matches.away.won / statistics.matches.away.played) * 100 : 0}%` }}
                title={`Vitórias: ${statistics.matches.away.won}`}
              ></div>
              <div 
                className="bg-gray-400 h-4" 
                style={{ width: `${statistics.matches.away.played > 0 ? (statistics.matches.away.drawn / statistics.matches.away.played) * 100 : 0}%` }}
                title={`Empates: ${statistics.matches.away.drawn}`}
              ></div>
              <div 
                className="bg-red-500 h-4" 
                style={{ width: `${statistics.matches.away.played > 0 ? (statistics.matches.away.lost / statistics.matches.away.played) * 100 : 0}%` }}
                title={`Derrotas: ${statistics.matches.away.lost}`}
              ></div>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span className="text-green-600">VIT ({statistics.matches.away.won})</span>
              <span className="text-gray-500">EMP ({statistics.matches.away.drawn})</span>
              <span className="text-red-600">DER ({statistics.matches.away.lost})</span>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-gray-600">Gols</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 my-1 flex overflow-hidden">
              <div 
                className="bg-green-500 h-4" 
                style={{ width: `${(statistics.matches.away.goalsFor + statistics.matches.away.goalsAgainst) > 0 ? (statistics.matches.away.goalsFor / (statistics.matches.away.goalsFor + statistics.matches.away.goalsAgainst)) * 100 : 0}%` }}
                title={`Gols Marcados: ${statistics.matches.away.goalsFor}`}
              ></div>
              <div 
                className="bg-red-500 h-4" 
                style={{ width: `${(statistics.matches.away.goalsFor + statistics.matches.away.goalsAgainst) > 0 ? (statistics.matches.away.goalsAgainst / (statistics.matches.away.goalsFor + statistics.matches.away.goalsAgainst)) * 100 : 0}%` }}
                title={`Gols Sofridos: ${statistics.matches.away.goalsAgainst}`}
              ></div>
            </div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span className="text-green-600">Marcados (+{statistics.matches.away.goalsFor})</span>
              <span className="text-red-600">Sofridos (-{statistics.matches.away.goalsAgainst})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Análise de Dificuldade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Análise de Dificuldade */}
        {difficultyAnalysis.analysis.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-600" />
              Análise de Dificuldade
            </h4>
            {difficultyAnalysis.analysis.map((analysis, index) => (
              <div key={index} className="border-t border-gray-200 pt-4">
                {analysis.analysisType === 'round-robin' ? (
                  // Card para Pontos Corridos
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-800">{analysis.competition.name}</h5>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(analysis.difficultyScore)}`}>
                        {analysis.difficultyLevel}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Jogos Restantes:</span>
                        <div className="font-medium">{analysis.remainingMatches}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Em Casa:</span>
                        <div className="font-medium text-green-600">{analysis.homeGames}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Fora:</span>
                        <div className="font-medium text-blue-600">{analysis.awayGames}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Score:</span>
                        <div className="font-medium flex items-center">
                          {getDifficultyIcon(analysis.difficultyScore)}
                          <span className="ml-1">{analysis.difficultyScore}/100</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fortes (G4):</span>
                        <span className="font-medium text-red-600">{analysis.strongOpponents}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Difíceis (5º-10º):</span>
                        <span className="font-medium text-orange-600">{analysis.difficultOpponents}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Médios (11º-16º):</span>
                        <span className="font-medium text-yellow-600">{analysis.mediumOpponents}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fracos (Z4):</span>
                        <span className="font-medium text-green-600">{analysis.weakOpponents}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-dashed">
                        <span className="text-gray-600">Posição Média:</span>
                        <span className="font-medium">{analysis.averageOpponentPosition}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Card para Mata-Mata
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-gray-800">{analysis.competition.name}</h5>
                        <p className="text-sm text-gray-500">{analysis.roundName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(analysis.difficultyScore)}`}>
                        {analysis.difficultyLevel}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Próximo Adversário</p>
                        <div className="flex items-center mt-1">
                           <img src={analysis.nextOpponent.logo_url} alt={analysis.nextOpponent.name} className="h-6 w-6 mr-2" />
                          <span className="font-semibold">{analysis.nextOpponent.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({analysis.nextOpponent.position}º {analysis.nextOpponent.positionContext})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Decisão</p>
                        <span className={`font-semibold ${analysis.isHome ? 'text-green-600' : 'text-blue-600'}`}>
                          {analysis.isHome ? 'Em Casa' : 'Fora'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Coluna 2: Título e Rebaixamento */}
        <div className="space-y-6">
          {/* Probabilidades de Título */}
          {titleChances && (titleChances.titleChances && titleChances.titleChances.length > 0 || titleChances.simulation_based) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 space-y-4">
              {titleChances.simulation_based ? (
                /* Formato novo com dados de simulação */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-800">{titleChances.competition?.name}</h5>
                    <div className="text-xs text-gray-600">
                      <span>Posição: {titleChances.current_position}º</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        Simulação Monte Carlo
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center my-4">
                    <div className="text-4xl font-bold text-green-600">
                      {titleChances.title_probability?.toFixed(1) || 0}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Chance de Título</p>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {titleChances.advanced_stats?.top4_probability?.toFixed(1) || 0}%
                        </div>
                        <p className="text-xs text-gray-600">G4 (Libertadores)</p>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {titleChances.advanced_stats?.average_final_position?.toFixed(0) || 0}º
                        </div>
                        <p className="text-xs text-gray-600">Posição Média</p>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-purple-600">
                          {titleChances.advanced_stats?.average_final_points?.toFixed(0) || 0}
                        </div>
                        <p className="text-xs text-gray-600">Pontos Médios</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-500">
                      Última simulação: {titleChances.execution_date ? new Date(titleChances.execution_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                /* Formato antigo para compatibilidade */
                titleChances.titleChances?.map((chance, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-800">{chance.competition.name}</h5>
                    <div className="text-xs text-gray-600">
                      <span>Posição: {chance.currentPosition}º</span>
                      <span className="ml-2">Pontos: {chance.currentPoints}</span>
                    </div>
                  </div>
                  
                  <div className="text-center my-4">
                    <div className="text-sm font-medium text-gray-700">Probabilidade de Título</div>
                    <div className="text-4xl font-bold text-green-600 my-1">{chance.titleChance}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full"
                        style={{ width: `${chance.titleChance}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-center border-t border-green-200 pt-3 mt-4">
                    <div>
                      <div className="text-gray-600">Diferença p/ Líder</div>
                      <div className={`font-bold ${chance.pointsGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {chance.pointsGap > 0 ? `+${chance.pointsGap}` : 'Líder'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Jogos Restantes</div>
                      <div className="font-bold">{chance.gamesRemaining}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Status</div>
                      <div className="font-bold">
                        {chance.analysis.canWin ? (
                          <span className="text-green-600">Pode Vencer</span>
                        ) : chance.analysis.needsHelp ? (
                          <span className="text-orange-600">Precisa de Ajuda</span>
                        ) : (
                          <span className="text-red-600">Difícil</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          )}

          {/* Risco de Rebaixamento */}
          {relegationRisk && (relegationRisk.relegationRisks && relegationRisk.relegationRisks.length > 0 || relegationRisk.simulation_based) && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200 space-y-4">
              {relegationRisk.simulation_based ? (
                /* Formato novo com dados de simulação */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-800">{relegationRisk.competition?.name}</h5>
                    <div className="text-xs text-gray-600">
                      <span>Posição: {relegationRisk.current_position}º</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        Simulação Monte Carlo
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center my-4">
                    <div className="text-4xl font-bold text-red-600">
                      {relegationRisk.relegation_probability?.toFixed(1) || 0}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Risco de Rebaixamento</p>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {relegationRisk.advanced_stats?.top6_probability?.toFixed(1) || 0}%
                        </div>
                        <p className="text-xs text-gray-600">G6 (Sul-Americana)</p>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {relegationRisk.advanced_stats?.average_final_position?.toFixed(0) || 0}º
                        </div>
                        <p className="text-xs text-gray-600">Posição Média</p>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-purple-600">
                          {relegationRisk.advanced_stats?.average_final_points?.toFixed(0) || 0}
                        </div>
                        <p className="text-xs text-gray-600">Pontos Médios</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-500">
                      Última simulação: {relegationRisk.execution_date ? new Date(relegationRisk.execution_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                /* Formato antigo para compatibilidade */
                relegationRisk.relegationRisks?.map((risk, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-800">{risk.competition.name}</h5>
                    <div className="text-xs text-gray-600">
                      <span>Posição: {risk.currentPosition}º</span>
                      <span className="ml-2">Pontos: {risk.currentPoints}</span>
                    </div>
                  </div>
                  
                  <div className="text-center my-4">
                    <div className="text-sm font-medium text-gray-700">Risco de Rebaixamento</div>
                    <div className="text-4xl font-bold text-red-600 my-1">{risk.relegationRisk}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-red-400 to-pink-500 h-2.5 rounded-full"
                        style={{ width: `${risk.relegationRisk}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-center border-t border-red-200 pt-3 mt-4">
                    <div>
                      <div className="text-gray-600">Pontos p/ Segurança</div>
                      <div className={`font-bold ${risk.pointsGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {risk.pointsGap > 0 ? `+${risk.pointsGap}` : 'Seguro'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Jogos Restantes</div>
                      <div className="font-bold">{risk.gamesRemaining}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Status</div>
                      <div className="font-bold">
                        {risk.analysis.inDanger ? (
                          <span className="text-red-600">Em Perigo</span>
                        ) : risk.analysis.needsPoints ? (
                          <span className="text-orange-600">Precisa de Pontos</span>
                        ) : (
                          <span className="text-green-600">Seguro</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comparação com Outros Times */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <TeamComparison currentTeamId={teamId} />
      </div>
    </div>
  );
}
