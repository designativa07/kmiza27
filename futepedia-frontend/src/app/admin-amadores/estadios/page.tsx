'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, MapPin, Building } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { useAuth } from '@/hooks/useAuth';

interface Stadium {
  id: number;
  name: string;
  city: string;
  state: string;
  country: string;
  capacity: number | null;
  address: string | null;
  description: string | null;
  image_url: string | null;
}

export default function EstadiosPage() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { requireAuth } = useAuth();
  const router = useRouter();

  // Verificar autenticação
  if (!requireAuth()) return null;

  useEffect(() => {
    fetchStadiums();
  }, []);

  const fetchStadiums = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/amateur/stadiums', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStadiums(data);
      } else {
        setError('Erro ao carregar estádios');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stadiumId: number) => {
    if (!confirm('Tem certeza que deseja excluir este estádio?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/stadiums/${stadiumId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchStadiums(); // Recarregar lista
      } else {
        setError('Erro ao excluir estádio');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estádios Amadores</h1>
              <p className="text-gray-600 mt-2">
                Gerencie os estádios dos seus campeonatos amadores
              </p>
            </div>
            <Link
              href="/admin-amadores/estadios/novo"
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Estádio</span>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Stadiums Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stadiums.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum estádio encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Comece criando seu primeiro estádio amador
                </p>
                <Link
                  href="/admin-amadores/estadios/novo"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Primeiro Estádio</span>
                </Link>
              </div>
            </div>
          ) : (
            stadiums.map((stadium) => (
              <div key={stadium.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {stadium.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{stadium.city}, {stadium.state}</span>
                    </div>
                    {stadium.capacity && (
                      <p className="text-sm text-gray-600 mb-2">
                        Capacidade: {stadium.capacity.toLocaleString()} lugares
                      </p>
                    )}
                    {stadium.address && (
                      <p className="text-sm text-gray-600 mb-2">
                        {stadium.address}
                      </p>
                    )}
                    {stadium.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {stadium.description}
                      </p>
                    )}
                  </div>
                  {stadium.image_url && (
                    <div className="ml-4">
                      <img
                        src={stadium.image_url}
                        alt={stadium.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                  <Link
                    href={`/admin-amadores/estadios/${stadium.id}/editar`}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(stadium.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
} 