'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Users, Calendar, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { getApiUrl } from '@/lib/config';
import { getStadiumImageUrl } from '@/lib/cdn'; // Usar a função do CDN
import { useDebounce } from 'use-debounce';

// Tipos
interface Stadium {
  id: number;
  name: string;
  city: string;
  state?: string;
  country?: string;
  capacity?: number;
  opened_year?: number;
  image_url?: string;
}

interface PaginatedStadiums {
  data: Stadium[];
  total: number;
}

const API_URL = getApiUrl();

async function getStadiums(page: number, limit: number, search: string): Promise<PaginatedStadiums> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
    });
    const res = await fetch(`${API_URL}/stadiums?${params.toString()}`);
    
    if (!res.ok) {
      console.error(`Error fetching stadiums: ${res.statusText}`);
      return { data: [], total: 0 };
    }
    
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch stadiums:', error);
    return { data: [], total: 0 };
  }
}

const StadiumCard = ({ stadium }: { stadium: Stadium }) => {
  return (
    <Link href={`/estadio/${stadium.id}`} className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="bg-gray-100 h-48 flex items-center justify-center relative">
        {stadium.image_url ? (
          <img 
            src={getStadiumImageUrl(stadium.image_url)} 
            alt={stadium.name} 
            className="h-full w-full object-cover"
          />
        ) : (
          <MapPin className="h-16 w-16 text-gray-400" />
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{stadium.name}</h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>
              {stadium.city}
              {stadium.state && `, ${stadium.state}`}
              {stadium.country && `, ${stadium.country}`}
            </span>
          </div>
          
          {stadium.capacity && (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{stadium.capacity.toLocaleString()} lugares</span>
            </div>
          )}
          
          {stadium.opened_year && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Inaugurado em {stadium.opened_year}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function StadiumsPage() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchStadiums = async () => {
      setLoading(true);
      const result = await getStadiums(currentPage, ITEMS_PER_PAGE, debouncedSearchTerm);
      setStadiums(result.data);
      setTotal(result.total);
      setLoading(false);
    };
    fetchStadiums();
  }, [currentPage, debouncedSearchTerm]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header showBackToHome={true} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estádios</h1>
            <p className="mt-1 text-sm text-gray-500">Conheça os principais estádios do mundo</p>
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
        ) : stadiums.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stadiums.map((stadium) => (
                <StadiumCard key={stadium.id} stadium={stadium} />
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
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum estádio encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar sua busca.
            </p>
          </div>
        )}
      </main>
    </div>
  );
} 