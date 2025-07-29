'use client';

import Link from 'next/link';
import { Shield, ListOrdered, CalendarDays, Target, ArrowLeft } from 'lucide-react';
import { getApiUrl } from '@/lib/config';
import { useState, useEffect } from 'react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import ImageWithFallback from '@/components/ImageWithFallback';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  category?: string;
}

async function getAmateurCompetitions(): Promise<Competition[]> {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/competitions?active=true&category=amateur`);
    if (!res.ok) {
      console.error(`Error fetching amateur competitions: ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return data.sort((a: Competition, b: Competition) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to fetch amateur competitions:', error);
    return [];
  }
}

export default function AmadoresPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      const data = await getAmateurCompetitions();
      setCompetitions(data);
      setLoading(false);
    };
    fetchCompetitions();
  }, []);

  const renderCompetitionList = (comps: Competition[], title: string) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {comps.map((comp) => (
          <div key={comp.id} className="p-3 sm:px-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <Link href={`/amadores/${comp.slug}/jogos`} className="flex items-center space-x-3 flex-1">
                <ImageWithFallback
                  src={comp.logo_url}
                  alt={comp.name}
                  fallbackType="competition"
                  size="xs"
                  className="h-7 w-7"
                />
                <span className="text-base text-gray-800">{comp.name}</span>
              </Link>
              <div className="flex items-center space-x-2 text-gray-400">
                <Link href={`/amadores/${comp.slug}/classificacao`} title="Classificação" className="hover:text-blue-600 transition-colors">
                  <ListOrdered className="h-5 w-5" />
                </Link>
                <Link href={`/amadores/${comp.slug}/jogos`} title="Jogos" className="hover:text-green-600 transition-colors">
                  <CalendarDays className="h-5 w-5" />
                </Link>
                <Link href={`/amadores/${comp.slug}/artilharia`} title="Artilharia" className="hover:text-red-600 transition-colors">
                  <Target className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header da página */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Voltar</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campeonatos Amadores</h1>
              <p className="text-gray-600 text-sm">Competições e torneios amadores</p>
            </div>
          </div>
        </div>

        {/* Lista de competições */}
        <div className="max-w-3xl">
          {loading ? (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-base font-bold text-gray-900 mb-4">Competições Amadoras</h2>
              {/* Skeleton Loader */}
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : competitions.length > 0 ? (
            <div>
              {renderCompetitionList(competitions, 'Competições Amadoras')}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="p-3 bg-indigo-100 rounded-full w-fit mx-auto mb-4">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma competição amadora encontrada</h3>
              <p className="text-gray-600 text-sm mb-4">
                Ainda não há campeonatos amadores cadastrados no sistema.
              </p>
              <div className="text-xs text-gray-500">
                <p>Para criar uma competição amadora, entre em contato conosco.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 