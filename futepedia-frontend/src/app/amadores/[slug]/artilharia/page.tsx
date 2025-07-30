'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Target, ListOrdered, Users } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { getApiUrl } from '@/lib/config';
import ImageWithFallback from '@/components/ImageWithFallback';

interface TopScorer {
  player_id: number;
  player_name: string;
  player_image: string | null;
  team_id: number;
  team_name: string;
  team_logo: string | null;
  goals: number;
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
    const res = await fetch(`${API_URL}/competitions?active=true&category=amateur`);
    if (!res.ok) return null;
    const competitions = await res.json();
    return competitions.find((comp: Competition) => comp.slug === slug) || null;
  } catch (error) {
    console.error('Failed to fetch amateur competition:', error);
    return null;
  }
}

async function getAmateurTopScorers(competitionId: number): Promise<TopScorer[]> {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/amateur/top-scorers/${competitionId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch amateur top scorers:', error);
    return [];
  }
}

export default function AmateurTopScorersPage({ params }: { params: { slug: string } }) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const comp = await getAmateurCompetition(params.slug);
      if (comp) {
        setCompetition(comp);
        const topScorersData = await getAmateurTopScorers(comp.id);
        setTopScorers(topScorersData);
      }
      setLoading(false);
    };
    fetchData();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
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
          
          <div className="flex items-center space-x-3 mb-4">
            <ImageWithFallback
              src={competition.logo_url}
              alt={competition.name}
              fallbackType="competition"
              size="md"
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
              <p className="text-gray-600 text-sm">Artilharia</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <Link href={`/amadores/${competition.slug}/jogos`} className="flex items-center text-gray-600 hover:text-green-600 transition-colors">
              <CalendarDays className="h-4 w-4 mr-1" />
              Jogos
            </Link>
            <Link href={`/amadores/${competition.slug}/classificacao`} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
              <ListOrdered className="h-4 w-4 mr-1" />
              Classificação
            </Link>
            <Link href={`/amadores/${competition.slug}/jogadores`} className="flex items-center text-gray-600 hover:text-purple-600 transition-colors">
              <Users className="h-4 w-4 mr-1" />
              Jogadores
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Artilharia</h2>
          </div>
          
          {topScorers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {topScorers.map((scorer, index) => (
                <div key={scorer.player_id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-bold text-gray-700">
                        {index + 1}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {scorer.player_image ? (
                          <ImageWithFallback
                            src={scorer.player_image}
                            alt={scorer.player_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm font-medium">
                              {scorer.player_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <div className="font-medium text-gray-900">{scorer.player_name}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <ImageWithFallback
                              src={scorer.team_logo}
                              alt={scorer.team_name}
                              fallbackType="team"
                              size="xs"
                              className="h-4 w-4"
                            />
                            <span>{scorer.team_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl font-bold text-gray-900">{scorer.goals}</div>
                      <div className="text-sm text-gray-500">gols</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Artilharia não disponível</h3>
              <p className="text-gray-600 text-sm">
                Ainda não há dados de artilharia para esta competição.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 