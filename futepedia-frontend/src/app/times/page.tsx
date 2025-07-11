'use client';

import { useState, useEffect, Suspense } from 'react';
import { Shield, Search, Filter, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { getApiUrl } from '@/lib/config';
import { getTeamLogoUrl } from '@/lib/cdn';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams } from 'next/navigation';

// Tipos
interface Team {
  id: number;
  name: string;
  short_name?: string;
  logo_url?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface PaginatedTeams {
  data: Team[];
  total: number;
}

interface TeamFilters {
  search: string;
  state: string;
  city: string;
  country: string;
  competitionId: string;
}

interface Competition {
  id: number;
  name: string;
  slug: string;
}

const API_URL = getApiUrl();

async function getTeams(page: number, limit: number, filters: TeamFilters): Promise<PaginatedTeams> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    
    // Adicionar filtros apenas se tiverem valores
    if (filters.search) params.append('search', filters.search);
    if (filters.state) params.append('state', filters.state);
    if (filters.city) params.append('city', filters.city);
    if (filters.country) params.append('country', filters.country);
    if (filters.competitionId) params.append('competitionId', filters.competitionId);
    
    const url = `${API_URL}/teams?${params.toString()}`;
    
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error(`Error fetching teams: ${res.statusText}`);
      return { data: [], total: 0 };
    }
    
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return { data: [], total: 0 };
  }
}

async function getCompetitions(): Promise<Competition[]> {
  try {
    const res = await fetch(`${API_URL}/competitions?active=true`);
    
    if (!res.ok) {
      console.error(`Error fetching competitions: ${res.statusText}`);
      return [];
    }
    
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    return [];
  }
}

async function getUniqueStates(country?: string): Promise<string[]> {
  try {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    
    const url = `${API_URL}/teams/filters/states${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error(`Error fetching states: ${res.statusText}`);
      return [];
    }
    
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch states:', error);
    return [];
  }
}

async function getUniqueCities(country?: string, state?: string): Promise<string[]> {
  try {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (state) params.append('state', state);
    
    const url = `${API_URL}/teams/filters/cities${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error(`Error fetching cities: ${res.statusText}`);
      return [];
    }
    
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch cities:', error);
    return [];
  }
}

async function getUniqueCountries(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/teams/filters/countries`);
    
    if (!res.ok) {
      console.error(`Error fetching countries: ${res.statusText}`);
      return [];
    }
    
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    return [];
  }
}

const TeamCard = ({ team }: { team: Team }) => {
  return (
    <Link href={`/time/${team.id}`} className="block">
      <div className="bg-white rounded-lg transition-shadow duration-300 overflow-hidden border border-gray-200 hover:border-indigo-300">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex-shrink-0">
              {team.logo_url ? (
                <img 
                  src={getTeamLogoUrl(team.logo_url)} 
                  alt={`${team.name} logo`} 
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-full">
                  <Shield className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate">{team.name}</h3>
              {team.short_name && team.short_name !== team.name && (
                <p className="text-xs text-gray-500">{team.short_name}</p>
              )}
            </div>
          </div>
          
          {(team.city || team.state) && (
            <div className="text-xs text-gray-600">
              <p>
                {team.city && team.state ? `${team.city}, ${team.state}` : 
                 team.city ? team.city : 
                 team.state ? team.state : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

// Componente interno que usa useSearchParams
function TeamsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<TeamFilters>({
    search: '',
    state: '',
    city: '',
    country: '',
    competitionId: '',
  });
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  
  const [debouncedFilters] = useDebounce(filters, 500);

  const ITEMS_PER_PAGE = 20;

  // Carregar filtros da URL na inicialização
  useEffect(() => {
    const urlFilters: TeamFilters = {
      search: searchParams.get('search') || '',
      state: searchParams.get('state') || '',
      city: searchParams.get('city') || '',
      country: searchParams.get('country') || '',
      competitionId: searchParams.get('competitionId') || '',
    };
    
    // Só atualizar se realmente houver mudança
    const currentFiltersString = JSON.stringify(filters);
    const newFiltersString = JSON.stringify(urlFilters);
    
    if (currentFiltersString !== newFiltersString) {
      setFilters(urlFilters);
    }
    
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    if (currentPage !== urlPage) {
      setCurrentPage(urlPage);
    }
    
    // Mostrar filtros se houver filtros ativos na URL
    const hasFilters = Object.values(urlFilters).some(Boolean);
    if (hasFilters) {
      setShowFilters(true);
    }
  }, [searchParams]);

  // Carregar dados para os filtros
  useEffect(() => {
    const fetchFilterData = async () => {
      const [competitionsData, countriesData] = await Promise.all([
        getCompetitions(),
        getUniqueCountries()
      ]);
      
      setCompetitions(competitionsData);
      setCountries(countriesData);
      
      // Carregar estados baseado no país selecionado
      const statesData = await getUniqueStates(filters.country || undefined);
      setStates(statesData);
      
      // Carregar cidades baseado no país e estado selecionados
      const citiesData = await getUniqueCities(
        filters.country || undefined, 
        filters.state || undefined
      );
      setCities(citiesData);
    };
    
    fetchFilterData();
  }, []);

  // Atualizar estados quando o país mudar
  useEffect(() => {
    const fetchStates = async () => {
      const statesData = await getUniqueStates(filters.country || undefined);
      setStates(statesData);
      
      // Limpar estado se não estiver na nova lista
      if (filters.state && !statesData.includes(filters.state)) {
        setFilters(prev => ({ ...prev, state: '', city: '' }));
      }
    };
    
    fetchStates();
  }, [filters.country]);

  // Atualizar cidades quando o país ou estado mudar
  useEffect(() => {
    const fetchCities = async () => {
      const citiesData = await getUniqueCities(
        filters.country || undefined,
        filters.state || undefined
      );
      setCities(citiesData);
      
      // Limpar cidade se não estiver na nova lista
      if (filters.city && !citiesData.includes(filters.city)) {
        setFilters(prev => ({ ...prev, city: '' }));
      }
    };
    
    fetchCities();
  }, [filters.country, filters.state]);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      const result = await getTeams(currentPage, ITEMS_PER_PAGE, debouncedFilters);
      setTeams(result.data);
      setTotal(result.total);
      setLoading(false);
    };
    fetchTeams();
  }, [currentPage, debouncedFilters]);

  // Resetar página quando filtros mudarem (exceto na primeira carga)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedFilters.search, debouncedFilters.state, debouncedFilters.city, debouncedFilters.country, debouncedFilters.competitionId]);

  // Função para verificar se há filtros ativos
  const hasActiveFilters = () => {
    return filters.search || filters.state || filters.city || filters.country || 
           filters.competitionId;
  };

  // Atualizar URL quando filtros mudarem
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.state) params.set('state', filters.state);
    if (filters.city) params.set('city', filters.city);
    if (filters.country) params.set('country', filters.country);
    if (filters.competitionId) params.set('competitionId', filters.competitionId);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '';
    
    router.replace(newUrl, { scroll: false });
  }, [filters, currentPage, router]);
  
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header showBackToHome={true} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Times</h1>
            <p className="mt-1 text-sm text-gray-500">Explore todos os times do mundo</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm ${
                hasActiveFilters() 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {hasActiveFilters() && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>
            <div className="relative sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome, cidade ou estado..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros Avançados</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Fechar filtros"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competição</label>
                <select
                  value={filters.competitionId}
                  onChange={(e) => setFilters(prev => ({ ...prev, competitionId: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  aria-label="Selecionar competição"
                >
                  <option value="">Todas as competições</option>
                  {competitions.map((competition) => (
                    <option key={competition.id} value={competition.id.toString()}>
                      {competition.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <select
                  value={filters.country}
                  onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value, state: '', city: '' }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  aria-label="Selecionar país"
                >
                  <option value="">Todos os países</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filters.state}
                  onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value, city: '' }))}
                  className={`block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${
                    !filters.country ? 'bg-gray-50 text-gray-400' : ''
                  }`}
                  aria-label="Selecionar estado"
                  disabled={!filters.country}
                >
                  <option value="">{!filters.country ? 'Selecione um país primeiro' : 'Todos os estados'}</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  className={`block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${
                    !filters.country ? 'bg-gray-50 text-gray-400' : ''
                  }`}
                  aria-label="Selecionar cidade"
                  disabled={!filters.country}
                >
                  <option value="">{!filters.country ? 'Selecione um país primeiro' : 'Todas as cidades'}</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  search: '',
                  state: '',
                  city: '',
                  country: '',
                  competitionId: '',
                })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : teams.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum time encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar sua busca ou limpar os filtros.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Componente de loading para o Suspense
function TeamsPageLoading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header showBackToHome={true} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </main>
    </div>
  );
}

// Componente principal exportado com Suspense
export default function TeamsPage() {
  return (
    <Suspense fallback={<TeamsPageLoading />}>
      <TeamsPageContent />
    </Suspense>
  );
} 