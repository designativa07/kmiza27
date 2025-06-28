'use client';

import Link from 'next/link';
import { Shield, ListOrdered, CalendarDays, Users, Building } from 'lucide-react';
import { getCompetitionLogoUrl } from '@/lib/cdn-simple';
import { getApiUrl } from '@/lib/config';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
}

async function getCompetitions(): Promise<Competition[]> {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/competitions`);
    if (!res.ok) {
      console.error(`Error fetching competitions: ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return data.sort((a: Competition, b: Competition) => {
      if (a.name.includes('Brasileirão') && !b.name.includes('Brasileirão')) return -1;
      if (!a.name.includes('Brasileirão') && b.name.includes('Brasileirão')) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    return [];
  }
}

export default function Home() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      const data = await getCompetitions();
      setCompetitions(data);
      setLoading(false);
    };
    fetchCompetitions();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          {/* Coluna Principal: Competições */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {loading ? (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Competições</h2>
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
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800">Competições</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {competitions.map((comp) => (
                    <Link
                      key={comp.id}
                      href={`/${comp.slug}/classificacao`}
                      className="block p-3 sm:px-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={getCompetitionLogoUrl(comp.logo_url || '')}
                            alt={comp.name}
                            className="h-7 w-7 object-contain"
                          />
                          <span className="font-semibold text-base text-gray-800">{comp.name}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-400">
                          <span title="Classificação">
                            <ListOrdered className="h-5 w-5" />
                          </span>
                          <span title="Jogos">
                            <CalendarDays className="h-5 w-5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna Lateral: Navegação Rápida */}
          <div className="order-1 lg:order-2">
            <div className="grid grid-cols-3 gap-2 lg:space-y-4 lg:grid-cols-1">
              <Link href="/times" className="group block">
                <div className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-200 transition-colors lg:flex-row lg:space-x-4 lg:p-4 text-center lg:text-left hover:bg-gray-50">
                  <div className="p-2 bg-indigo-100 rounded-full">
                     <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">Times</h4>
                    <p className="hidden lg:block text-sm text-gray-600">Explore os times</p>
                  </div>
                </div>
              </Link>

              <Link href="/jogadores" className="group block">
                 <div className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-200 transition-colors lg:flex-row lg:space-x-4 lg:p-4 text-center lg:text-left hover:bg-gray-50">
                  <div className="p-2 bg-green-100 rounded-full">
                     <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">Jogadores</h4>
                    <p className="hidden lg:block text-sm text-gray-600">Conheça os jogadores</p>
                  </div>
                </div>
              </Link>

              <Link href="/estadios" className="group block">
                 <div className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-200 transition-colors lg:flex-row lg:space-x-4 lg:p-4 text-center lg:text-left hover:bg-gray-50">
                  <div className="p-2 bg-orange-100 rounded-full">
                     <Building className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">Estádios</h4>
                    <p className="hidden lg:block text-sm text-gray-600">Visite os estádios</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
