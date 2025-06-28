'use client';

import { useState, useEffect } from 'react';
import { Shield, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { getApiUrl } from '@/lib/config';
import { getTeamLogoUrl } from '@/lib/cdn';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';

// Tipos
interface Team {
  id: number;
  name: string;
  short_name?: string;
  logo_url?: string;
  city?: string;
  state?: string;
}

interface PaginatedTeams {
  data: Team[];
  total: number;
}

const API_URL = getApiUrl();

async function getTeams(page: number, limit: number, search: string): Promise<PaginatedTeams> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
    });
    const res = await fetch(`${API_URL}/teams?${params.toString()}`);
    
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

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      const result = await getTeams(currentPage, ITEMS_PER_PAGE, debouncedSearchTerm);
      setTeams(result.data);
      setTotal(result.total);
      setLoading(false);
    };
    fetchTeams();
  }, [currentPage, debouncedSearchTerm]);
  
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
          <div className="relative mt-4 sm:mt-0 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome, cidade ou estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

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