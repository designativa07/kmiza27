'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Target, ListOrdered } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { getApiUrl } from '@/lib/config';
import { getCompetitionLogoUrl } from '@/lib/cdn-simple';
import ImageWithFallback from '@/components/ImageWithFallback';

interface Match {
  id: number;
  match_date: string;
  home_team: {
    id: number;
    name: string;
    logo_url: string | null;
  };
  away_team: {
    id: number;
    name: string;
    logo_url: string | null;
  };
  home_score: number | null;
  away_score: number | null;
  status: string;
  phase: string | null;
  stadium: {
    id: number;
    name: string;
  } | null;
}

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  category?: string;
}

async function getAmateurCompetition(slug: string): Promise<Competition | null> {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/competitions?category=amateur`);
    if (!res.ok) return null;
    const competitions = await res.json();
    return competitions.find((comp: Competition) => comp.slug === slug) || null;
  } catch (error) {
    console.error('Failed to fetch amateur competition:', error);
    return null;
  }
}

async function getAmateurMatches(competitionId: number): Promise<Match[]> {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/amateur/matches?competitionId=${competitionId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch amateur matches:', error);
    return [];
  }
}

export default function AmateurMatchesPage({ params }: { params: { slug: string } }) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const comp = await getAmateurCompetition(params.slug);
      if (comp) {
        setCompetition(comp);
        const matchesData = await getAmateurMatches(comp.id);
        setMatches(matchesData);
      }
      setLoading(false);
    };
    fetchData();
  }, [params.slug]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'live': return 'Ao Vivo';
      case 'finished': return 'Finalizado';
      case 'postponed': return 'Adiado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-red-600';
      case 'finished': return 'text-green-600';
      case 'postponed': return 'text-yellow-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Competição não encontrada</h1>
            <Link href="/amadores" className="text-indigo-600 hover:text-indigo-800">
              Voltar para Amadores
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Link href="/amadores" className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Voltar</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <ImageWithFallback
              src={competition?.logo_url}
              alt={competition?.name || 'Competição'}
              fallbackType="competition"
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {competition?.name || 'Carregando...'}
              </h1>
              <p className="text-gray-600">Jogos da Competição</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <Link href={`/amadores/${competition.slug}/classificacao`} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
              <ListOrdered className="h-4 w-4 mr-1" />
              Classificação
            </Link>
            <Link href={`/amadores/${competition.slug}/artilharia`} className="flex items-center text-gray-600 hover:text-red-600 transition-colors">
              <Target className="h-4 w-4 mr-1" />
              Artilharia
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Jogos</h2>
          </div>
          
          {matches.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {matches.map((match) => (
                <div key={match.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-center min-w-[60px]">
                        <div className="text-xs text-gray-500 mb-1">
                          {formatDate(match.match_date)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(match.match_date)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex items-center space-x-2 flex-1 justify-end">
                          <span className="text-sm font-medium text-gray-900">{match.home_team.name}</span>
                          <img
                            src={getCompetitionLogoUrl(match.home_team.logo_url || '')}
                            alt={match.home_team.name}
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        
                        <div className="text-center min-w-[60px]">
                          {match.home_score !== null && match.away_score !== null ? (
                            <div className="text-lg font-bold text-gray-900">
                              {match.home_score} - {match.away_score}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">vs</div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-1">
                          <img
                            src={getCompetitionLogoUrl(match.away_team.logo_url || '')}
                            alt={match.away_team.name}
                            className="h-6 w-6 object-contain"
                          />
                          <span className="text-sm font-medium text-gray-900">{match.away_team.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className={`text-xs font-medium ${getStatusColor(match.status)}`}>
                        {getStatusText(match.status)}
                      </div>
                      {match.stadium && (
                        <div className="text-xs text-gray-500 mt-1">
                          {match.stadium.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum jogo encontrado</h3>
              <p className="text-gray-600 text-sm">
                Ainda não há jogos cadastrados para esta competição.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 