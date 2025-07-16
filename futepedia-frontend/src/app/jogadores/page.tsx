'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/config';
import { Search, User } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { PlayerCard } from '@/components/PlayerCard';

// Tipos
interface Player {
  id: number;
  name: string;
  image_url?: string;
  position: string;
  state: string;
  date_of_birth?: string;
  current_team?: {
    id: number;
    name: string;
  };
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${getApiUrl()}/players?page=${currentPage}&limit=24&search=${debouncedSearchTerm}`);
        const data = await res.json();
        
        setPlayers(data.data || []);
        setTotalPages(Math.ceil((data.total || 0) / 24));
      } catch (error) {
        console.error("Failed to fetch players:", error);
        setPlayers([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [currentPage, debouncedSearchTerm]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jogadores</h1>
            <p className="mt-1 text-sm text-gray-500">Ficha técnica dos jogadores</p>
          </div>
          <div className="relative mt-4 sm:mt-0 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou posição..."
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 mt-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-t-lg"></div>
                <div className="p-2 md:p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : players.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 mt-6">
            {players.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                teamName={player.current_team?.name}
                showTeamName={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow mt-6">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum jogador encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar sua busca.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-4">
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
      </main>
    </div>
  );
} 