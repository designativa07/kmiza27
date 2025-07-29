'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Trophy,
  Calendar,
  Shield,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ImageWithFallback from '@/components/ImageWithFallback';
import AmateurCompetitionTeamsForm from '@/components/AmateurCompetitionTeamsForm';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
}

export default function CompeticoesPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTeamsForm, setShowTeamsForm] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const { user, requireAuth } = useAuth();

  useEffect(() => {
    if (!requireAuth()) return;
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/amateur/competitions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompetitions(data);
      } else {
        setError('Erro ao carregar competições');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta competição?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/competitions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCompetitions();
      } else {
        setError('Erro ao excluir competição');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleManageTeams = (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowTeamsForm(true);
  };

  const handleSaveTeams = async (competitionTeams: any[]) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/amateur/competitions/${selectedCompetition?.id}/teams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ competition_teams: competitionTeams })
      });

      if (response.ok) {
        setShowTeamsForm(false);
        setSelectedCompetition(null);
      } else {
        setError('Erro ao salvar times da competição');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleCancelTeams = () => {
    setShowTeamsForm(false);
    setSelectedCompetition(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Competições</h1>
            <p className="mt-2 text-gray-600">Gerencie suas competições amadoras</p>
          </div>
          <Link
            href="/admin-amadores/competicoes/nova"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Competição</span>
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Competitions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Competições ({competitions.length})</h2>
        </div>
        
        {competitions.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma competição encontrada</h3>
            <p className="text-gray-600 mb-4">Crie sua primeira competição amadora para começar</p>
            <Link
              href="/admin-amadores/competicoes/nova"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Competição</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {competitions.map((competition) => (
              <div key={competition.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={competition.logo_url}
                        alt={competition.name}
                        fallbackType="competition"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{competition.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Criada em {new Date(competition.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          competition.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {competition.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleManageTeams(competition)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Times</span>
                    </button>
                    <Link
                      href={`/amadores/${competition.slug}/classificacao`}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Classificação</span>
                    </Link>
                    <Link
                      href={`/admin-amadores/competicoes/${competition.id}/editar`}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(competition.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams Form Modal */}
      {showTeamsForm && selectedCompetition && (
        <AmateurCompetitionTeamsForm
          competition={selectedCompetition}
          onSave={handleSaveTeams}
          onCancel={handleCancelTeams}
        />
      )}
    </div>
  );
} 