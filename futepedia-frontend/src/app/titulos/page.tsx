'use client';

import { useState, useEffect } from 'react';
import { Trophy, Search, Filter, Calendar, Users, Building } from 'lucide-react';
import { getTeamLogoUrl } from '@/lib/cdn-simple';
import { getApiUrl } from '@/lib/config';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';

interface Title {
  id: number;
  name: string;
  competition_name?: string;
  season?: string;
  year?: number;
  description?: string;
  category?: string;
  type?: string;
  image_url?: string;
  team_id: number;
  team: {
    id: number;
    name: string;
    logo_url?: string;
  };
}

interface Team {
  id: number;
  name: string;
  short_name?: string;
  logo_url?: string;
}

export default function TitulosPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [selectedTeamName, setSelectedTeamName] = useState('');

  useEffect(() => {
    fetchTitles();
    fetchTeams();
  }, [searchTerm, selectedTeamId, selectedCategory]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.team-search-container')) {
        setShowTeamDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTitles = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTeamId) params.append('teamId', selectedTeamId.toString());
      
      const response = await fetch(`${getApiUrl()}/titles?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        let filteredTitles = data.data || data;
        
        // Filtrar por categoria se selecionada
        if (selectedCategory) {
          filteredTitles = filteredTitles.filter((title: Title) => 
            title.category === selectedCategory
          );
        }
        
        setTitles(filteredTitles);
      }
    } catch (error) {
      console.error('Erro ao buscar títulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      // Usar endpoint que retorna todos os times sem paginação
      const response = await fetch(`${getApiUrl()}/teams/all`);
      if (response.ok) {
        const teamsData = await response.json();
        console.log(`✅ Carregados ${teamsData.length} times`);
        setTeams(teamsData);
        setFilteredTeams(teamsData);
      } else {
        // Fallback: buscar com limite alto se o endpoint /all não existir
        console.log('⚠️ Endpoint /all não encontrado, usando fallback');
        const fallbackResponse = await fetch(`${getApiUrl()}/teams?limit=1000`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          const teamsData = data.data || data;
          console.log(`✅ Carregados ${teamsData.length} times (fallback)`);
          setTeams(teamsData);
          setFilteredTeams(teamsData);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar times:', error);
    }
  };

  // Filtrar times baseado no termo de busca
  const filterTeams = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredTeams(teams);
      return;
    }
    
    const filtered = teams.filter(team => 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.short_name && team.short_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredTeams(filtered);
  };

  // Selecionar time
  const selectTeam = (team: Team) => {
    setSelectedTeamId(team.id);
    setSelectedTeamName(team.name);
    setTeamSearchTerm(team.name);
    setShowTeamDropdown(false);
  };

  // Limpar seleção de time
  const clearTeamSelection = () => {
    setSelectedTeamId('');
    setSelectedTeamName('');
    setTeamSearchTerm('');
    setShowTeamDropdown(false);
  };

  // Agrupar títulos por categoria
  const groupedTitles = titles.reduce((acc, title) => {
    const category = title.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(title);
    return acc;
  }, {} as Record<string, Title[]>);

  // Ordenar categorias
  const categoryOrder = ['Nacional', 'Internacional', 'Estadual', 'Regional', 'Outros'];
  const sortedCategories = Object.keys(groupedTitles).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return aIndex - bIndex;
  });

  const categories = ['Nacional', 'Internacional', 'Estadual', 'Regional'];

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Títulos</h1>
          <p className="text-gray-600">
            Explore os títulos conquistados pelos times brasileiros e internacionais.
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar títulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative team-search-container">
              <input
                type="text"
                placeholder="Buscar times..."
                value={teamSearchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setTeamSearchTerm(value);
                  filterTeams(value);
                  setShowTeamDropdown(true);
                  if (!value.trim()) {
                    clearTeamSelection();
                  }
                }}
                onFocus={() => setShowTeamDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {selectedTeamId && (
                <button
                  onClick={clearTeamSelection}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
              
              {/* Dropdown de times */}
              {showTeamDropdown && filteredTeams.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => selectTeam(team)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
                    >
                      {team.logo_url ? (
                        <img
                          src={getTeamLogoUrl(team.logo_url)}
                          alt={`${team.name} logo`}
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <Trophy className="h-3 w-3 text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium">{team.name}</span>
                      {team.short_name && team.short_name !== team.name && (
                        <span className="text-sm text-gray-500">({team.short_name})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTeamId('');
                setSelectedCategory('');
                clearTeamSelection();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar
            </button>
          </div>
        </div>

        {/* Lista de Títulos */}
        {titles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum título encontrado</h3>
            <p className="text-gray-500">
              {searchTerm || selectedTeamId || selectedCategory 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Nenhum título foi registrado ainda.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((category) => (
              <div key={category} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">{category}</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {groupedTitles[category].map((title) => (
                    <div key={title.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Logo do time */}
                          <div className="flex items-center space-x-3">
                            {title.team.logo_url ? (
                              <img
                                src={getTeamLogoUrl(title.team.logo_url)}
                                alt={`${title.team.name} logo`}
                                className="h-10 w-10 object-contain"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">{title.team.name}</h3>
                              <p className="text-sm text-gray-500">{title.name}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          {/* Imagem do troféu */}
                          {title.image_url && (
                            <div className="flex items-center space-x-2">
                              <img
                                src={title.image_url}
                                alt={`Troféu ${title.name}`}
                                className="h-8 w-8 object-contain rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          {/* Informações do título */}
                          <div className="text-right">
                            {title.competition_name && (
                              <div className="font-medium text-gray-900">{title.competition_name}</div>
                            )}
                            {title.year && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{title.year}</span>
                              </div>
                            )}
                            {title.type && (
                              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {title.type}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Descrição */}
                      {title.description && (
                        <div className="mt-3 text-sm text-gray-600">
                          {title.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 