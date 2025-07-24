'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Trophy, User, Target, BarChart3, Filter } from 'lucide-react';
import { getCdnImageUrl, getTeamLogoUrl, getPlayerImageUrl } from '@/lib/cdn-simple';
import Link from 'next/link';
import { getApiUrl } from '@/lib/config';

interface Player {
  id: number;
  name: string;
  position: string;
  image_url: string;
}

interface Team {
  id: number;
  name: string;
  logo_url: string;
}

export interface TopScorer {
  player: Player;
  team: Team;
  goals: number;
  matches_played?: number;
  goals_per_match?: number;
  competition?: {
    id: number;
    name: string;
    season: string;
  };
}

interface TopScorersTableProps {
  topScorers: TopScorer[];
  competitionName?: string;
}

interface TopScorersChartProps {
  topScorers: TopScorer[];
  maxPlayers?: number;
}

const TopScorersChart = ({ topScorers, maxPlayers = 10 }: TopScorersChartProps) => {
  const topPlayers = topScorers.slice(0, maxPlayers);
  const maxGoals = topPlayers.length > 0 ? topPlayers[0].goals : 0;

  if (topPlayers.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum artilheiro encontrado</h3>
        <p className="text-sm text-gray-500">Ainda não há dados de artilharia disponíveis.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
        Top {maxPlayers} Artilheiros
      </h3>
      
      <div className="space-y-4">
        {topPlayers.map((scorer, index) => {
          const percentage = maxGoals > 0 ? (scorer.goals / maxGoals) * 100 : 0;
          
          return (
            <div key={scorer.player.id} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {scorer.player.image_url ? (
                      <img 
                        className="h-8 w-8 rounded-full object-cover" 
                        src={getPlayerImageUrl(scorer.player.image_url)}
                        alt={scorer.player.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">
                          {scorer.player.name ? scorer.player.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {scorer.player.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {scorer.team.name}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {scorer.goals} gols
                  </div>
                  {scorer.goals_per_match && (
                    <div className="text-xs text-gray-500">
                      {scorer.goals_per_match.toFixed(2)} por jogo
                    </div>
                  )}
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Estatísticas resumidas */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {topPlayers.reduce((sum, scorer) => sum + scorer.goals, 0)}
            </div>
            <div className="text-xs text-gray-500">Total de Gols</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {topPlayers.length > 0 
                ? (topPlayers.reduce((sum, scorer) => sum + (scorer.goals_per_match || 0), 0) / topPlayers.length).toFixed(2)
                : '0.00'
              }
            </div>
            <div className="text-xs text-gray-500">Média por Jogo</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {topPlayers.reduce((sum, scorer) => sum + (scorer.matches_played || 0), 0)}
            </div>
            <div className="text-xs text-gray-500">Total de Jogos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TopScorersTable = ({ topScorers, competitionName }: TopScorersTableProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filteredScorers, setFilteredScorers] = useState<TopScorer[]>(topScorers);
  const [filters, setFilters] = useState({
    team: '',
    position: ''
  });

  useEffect(() => {
    applyFilters();
  }, [filters, topScorers]);

  const applyFilters = () => {
    let filtered = [...topScorers];

    if (filters.team) {
      filtered = filtered.filter(scorer => scorer.team.name.toLowerCase().includes(filters.team.toLowerCase()));
    }

    if (filters.position) {
      filtered = filtered.filter(scorer => scorer.player.position.toLowerCase().includes(filters.position.toLowerCase()));
    }

    setFilteredScorers(filtered);
  };

  const clearFilters = () => {
    setFilters({ team: '', position: '' });
  };

  const getUniqueTeams = () => {
    const teams = topScorers.map(scorer => scorer.team.name);
    return [...new Set(teams)];
  };

  const getUniquePositions = () => {
    const positions = topScorers.map(scorer => scorer.player.position);
    return [...new Set(positions)];
  };

  if (!topScorers || topScorers.length === 0) {
    return (
      <div className="text-center py-16">
        <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-900">Artilharia Indisponível</h3>
        <p className="mt-2 text-md text-gray-500">
          Ainda não há dados de artilharia para este campeonato.
        </p>
      </div>
    );
  }

  const tableHeaders = ['#', 'Jogador', 'Time', 'Gols'];

  return (
    <div className="space-y-6">
      {/* Header com título e filtros */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            Artilharia
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Ranking dos maiores artilheiros
          </p>
          {competitionName && (
            <p className="text-sm text-gray-600 mt-1">
              {competitionName}
            </p>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="text"
                value={filters.team}
                onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                placeholder="Digite o nome do time..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
              <input
                type="text"
                value={filters.position}
                onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                placeholder="Digite a posição..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {filteredScorers.length} jogadores encontrados
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {/* Gráfico dos Top Artilheiros */}
      {filteredScorers.length > 0 && (
        <TopScorersChart topScorers={filteredScorers} maxPlayers={10} />
      )}

      {/* Tabela de Artilharia */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableHeaders.map((header, index) => (
                  <th
                    key={header}
                    scope="col"
                    className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                      index === 0 ? 'text-left' : index < 3 ? 'text-left' : 'text-center'
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScorers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    Nenhum artilheiro encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredScorers.map((scorer, index) => (
                  <tr key={scorer.player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {scorer.player.image_url ? (
                          <img 
                            className="h-8 w-8 rounded-full object-cover mr-3" 
                            src={getPlayerImageUrl(scorer.player.image_url)}
                            alt={scorer.player.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-gray-600">
                              {scorer.player.name ? scorer.player.name.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-gray-900">{scorer.player.name}</div>
                          <div className="text-xs text-gray-500">{scorer.player.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {scorer.team.logo_url ? (
                          <img 
                            src={getTeamLogoUrl(scorer.team.logo_url)}
                            alt={scorer.team.name} 
                            className="h-6 w-6 object-contain mr-2"
                          />
                        ) : (
                          <ShieldCheck className="h-6 w-6 text-gray-300 mr-2" />
                        )}
                        <span className="text-sm text-gray-800">{scorer.team.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {scorer.goals}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Artilheiro</p>
              <p className="text-lg font-bold text-gray-900">
                {filteredScorers.length > 0 ? `${filteredScorers[0].goals} gols` : '0 gols'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Artilheiros</p>
              <p className="text-lg font-bold text-gray-900">{filteredScorers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Gols</p>
              <p className="text-lg font-bold text-gray-900">
                {filteredScorers.reduce((sum, scorer) => sum + scorer.goals, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Média Geral</p>
              <p className="text-lg font-bold text-gray-900">
                {filteredScorers.length > 0 
                  ? (filteredScorers.reduce((sum, scorer) => sum + (scorer.goals_per_match || 0), 0) / filteredScorers.length).toFixed(2)
                  : '0.00'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 

// Componente para buscar e exibir artilharia
export const TopScorersPage = () => {
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    competition_id: '',
    season: '',
    team_id: '',
    team_name: '',
    position: ''
  });

  const positions = [
    'Goleiro',
    'Zagueiro',
    'Lateral',
    'Volante',
    'Meio-campo',
    'Atacante'
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar dados em paralelo
        const [topScorersRes, competitionsRes, teamsRes] = await Promise.all([
          fetch(`${getApiUrl()}/matches/top-scorers`),
          fetch(`${getApiUrl()}/competitions`),
          fetch(`${getApiUrl()}/teams`)
        ]);

        if (!topScorersRes.ok) {
          throw new Error('Erro ao buscar artilheiros');
        }
        if (!competitionsRes.ok) {
          throw new Error('Erro ao buscar competições');
        }
        if (!teamsRes.ok) {
          throw new Error('Erro ao buscar times');
        }

        const [topScorersData, competitionsData, teamsData] = await Promise.all([
          topScorersRes.json(),
          competitionsRes.json(),
          teamsRes.json()
        ]);

        setTopScorers(Array.isArray(topScorersData) ? topScorersData : []);
        setCompetitions(Array.isArray(competitionsData) ? competitionsData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);

        // Debug logs
        console.log('🔍 Teams data:', teamsData);
        console.log('🔍 Competitions data:', competitionsData);
        console.log('🔍 Top scorers data:', topScorersData);

        // Extrair temporadas das competições
        const uniqueSeasons = Array.isArray(competitionsData) 
          ? [...new Set(competitionsData
              .map((comp: any) => comp.season)
              .filter(Boolean)
            )] as string[]
          : [];
        
        setSeasons(uniqueSeasons.sort().reverse());

      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar dados de artilharia');
        setTopScorers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const applyFilters = () => {
    let filtered = [...topScorers];

    if (filters.competition_id) {
      filtered = filtered.filter(scorer => 
        scorer.competition?.id?.toString() === filters.competition_id
      );
    }

    if (filters.season) {
      filtered = filtered.filter(scorer => 
        scorer.competition?.season === filters.season
      );
    }

    if (filters.team_id) {
      filtered = filtered.filter(scorer => 
        scorer.team.id.toString() === filters.team_id
      );
    }

    if (filters.team_name) {
      filtered = filtered.filter(scorer => 
        scorer.team.name.toLowerCase().includes(filters.team_name.toLowerCase())
      );
    }

    if (filters.position) {
      filtered = filtered.filter(scorer => 
        scorer.player.position === filters.position
      );
    }

    return filtered;
  };

  const clearFilters = () => {
    setFilters({
      competition_id: '',
      season: '',
      team_id: '',
      team_name: '',
      position: ''
    });
  };

  const filteredScorers = applyFilters();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Erro ao carregar dados</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com título e filtros */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            Artilharia
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Ranking dos maiores artilheiros
          </p>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Competição</label>
              <select
                value={filters.competition_id}
                onChange={(e) => setFilters({ ...filters, competition_id: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2"
                aria-label="Selecionar competição"
              >
                <option value="">Todas</option>
                {Array.isArray(competitions) && competitions.length > 0 ? competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                )) : (
                  <option value="" disabled>Carregando competições...</option>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporada</label>
              <select
                value={filters.season}
                onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2"
                aria-label="Selecionar temporada"
              >
                <option value="">Todas</option>
                {Array.isArray(seasons) && seasons.length > 0 ? seasons.map((season) => (
                  <option key={season} value={season}>{season}</option>
                )) : (
                  <option value="" disabled>Carregando temporadas...</option>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="text"
                value={filters.team_name}
                onChange={(e) => setFilters({ ...filters, team_name: e.target.value, team_id: '' })}
                placeholder="Digite o nome do time..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2"
                aria-label="Buscar time"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
              <select
                value={filters.position}
                onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-4 py-2"
                aria-label="Selecionar posição"
              >
                <option value="">Todas</option>
                {positions.map((position) => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {filteredScorers.length} jogadores encontrados
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {/* Gráfico dos Top Artilheiros */}
      {filteredScorers.length > 0 && (
        <TopScorersChart topScorers={filteredScorers} maxPlayers={10} />
      )}

      {/* Tabela de Artilharia */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jogador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gols
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jogos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Média
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScorers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Nenhum artilheiro encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredScorers.map((scorer, index) => (
                  <tr key={scorer.player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {scorer.player.image_url ? (
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={getPlayerImageUrl(scorer.player.image_url)}
                            alt={scorer.player.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-600">
                              {scorer.player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {scorer.player.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {scorer.player.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {scorer.team.logo_url ? (
                          <img 
                            className="h-6 w-6 rounded-md object-contain" 
                            src={getTeamLogoUrl(scorer.team.logo_url)}
                            alt={scorer.team.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">
                              {scorer.team.name.substring(0, 3)}
                            </span>
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {scorer.team.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                        {scorer.goals}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {scorer.matches_played || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {scorer.goals_per_match?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estatísticas resumidas */}
      {filteredScorers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Artilheiro
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredScorers[0]?.player.name} ({filteredScorers[0]?.goals} gols)
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Artilheiros
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredScorers.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Gols
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredScorers.reduce((sum, scorer) => sum + scorer.goals, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Média Geral
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredScorers.length > 0 
                        ? (filteredScorers.reduce((sum, scorer) => sum + (scorer.goals_per_match || 0), 0) / filteredScorers.length).toFixed(2)
                        : '0.00'
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 