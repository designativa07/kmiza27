'use client';

import Link from 'next/link';
import { Shield, ListOrdered, CalendarDays, Users, Building, Target, Trophy } from 'lucide-react';
import { getCompetitionLogoUrl } from '@/lib/cdn-simple';
import { getApiUrl } from '@/lib/config';
import { useState, useEffect } from 'react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { TeamsCard } from '@/components/TeamsCard';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
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

  const nationalCompetitions = competitions.filter(c => c.country === 'Brasil');
  const internationalCompetitions = competitions.filter(c => c.country !== 'Brasil');

  const renderCompetitionList = (comps: Competition[], title: string) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {comps.map((comp) => (
          <div key={comp.id} className="p-3 sm:px-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <Link href={`/${comp.slug}/jogos`} className="flex items-center space-x-3 flex-1">
                <img
                  src={getCompetitionLogoUrl(comp.logo_url || '')}
                  alt={comp.name}
                  className="h-7 w-7 object-contain"
                />
                <span className="text-base text-gray-800">{comp.name}</span>
              </Link>
              <div className="flex items-center space-x-2 text-gray-400">
                <Link href={`/${comp.slug}/classificacao`} title="Classificação" className="hover:text-blue-600 transition-colors">
                  <ListOrdered className="h-5 w-5" />
                </Link>
                <Link href={`/${comp.slug}/jogos`} title="Jogos" className="hover:text-green-600 transition-colors">
                  <CalendarDays className="h-5 w-5" />
                </Link>
                <Link href={`/${comp.slug}/artilharia`} title="Artilharia" className="hover:text-red-600 transition-colors">
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
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4">
          {/* Coluna Principal: Competições */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {loading ? (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-base font-bold text-gray-900 mb-4">Competições</h2>
                {/* Skeleton Loader */}
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 animate-pulse">
                      <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                      <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {nationalCompetitions.length > 0 && renderCompetitionList(nationalCompetitions, 'Nacional')}
                {internationalCompetitions.length > 0 && renderCompetitionList(internationalCompetitions, 'Internacional')}
              </div>
            )}
          </div>

          {/* Coluna Lateral: Navegação Rápida */}
          <div className="order-1 lg:order-2 lg:col-span-2">
            <div className="space-y-4">
              <TeamsCard />

                             <div>
                 <h4 className="font-bold text-gray-900 mb-1 px-1 text-sm">Jogos</h4>
                 <div className="grid grid-cols-3 gap-2 mb-3">
                   <Link href="/ultimos-jogos" className="group block p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                     <div className="flex flex-col items-center text-center">
                       <div className="p-1 bg-red-100 rounded-full">
                         <CalendarDays className="h-4 w-4 text-red-600" />
                       </div>
                       <div className="mt-1">
                         <h4 className="font-bold text-gray-900 text-xs">Últimos</h4>
                       </div>
                     </div>
                   </Link>

                   <Link href="/jogos-hoje" className="group block p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                     <div className="flex flex-col items-center text-center">
                       <div className="p-1 bg-green-100 rounded-full">
                         <CalendarDays className="h-4 w-4 text-green-600" />
                       </div>
                       <div className="mt-1">
                         <h4 className="font-bold text-gray-900 text-xs">Hoje</h4>
                       </div>
                     </div>
                   </Link>

                   <Link href="/jogos-semana" className="group block p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                     <div className="flex flex-col items-center text-center">
                       <div className="p-1 bg-blue-100 rounded-full">
                         <CalendarDays className="h-4 w-4 text-blue-600" />
                       </div>
                       <div className="mt-1">
                         <h4 className="font-bold text-gray-900 text-xs">Semana</h4>
                       </div>
                     </div>
                   </Link>
                 </div>
               </div>

               <div>
                 <h4 className="font-bold text-gray-900 mb-1 px-1 text-sm">Informações</h4>
                 <div className="grid grid-cols-3 gap-2">
                 <Link href="/jogadores" className="group block p-2 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                   <div className="flex flex-col items-center text-center">
                     <div className="p-1 bg-yellow-100 rounded-full">
                       <Users className="h-4 w-4 text-yellow-600" />
                     </div>
                     <div className="mt-1">
                       <h4 className="font-bold text-gray-900 text-xs">Jogadores</h4>
                     </div>
                   </div>
                 </Link>

                 <Link href="/estadios" className="group block p-2 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                   <div className="flex flex-col items-center text-center">
                     <div className="p-1 bg-orange-100 rounded-full">
                       <Building className="h-4 w-4 text-orange-600" />
                     </div>
                     <div className="mt-1">
                       <h4 className="font-bold text-gray-900 text-xs">Estádios</h4>
                     </div>
                   </div>
                 </Link>

                                  <Link href="/titulos" className="group block p-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-1 bg-purple-100 rounded-full">
                        <Trophy className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="mt-1">
                        <h4 className="font-bold text-gray-900 text-xs">Títulos</h4>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

               <div>
                 <h4 className="font-bold text-gray-900 mb-1 px-1 text-sm">Amadores</h4>
                 <div className="grid grid-cols-1 gap-2">
                   <Link href="/amadores" className="group block p-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                     <div className="flex items-center justify-center">
                       <div className="p-1 bg-indigo-100 rounded-full">
                         <Shield className="h-4 w-4 text-indigo-600" />
                       </div>
                       <p className="ml-1 font-medium text-xs text-gray-700">Campeonatos Amadores</p>
                     </div>
                   </Link>
                   <Link href="/login" className="group block p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                     <div className="flex items-center justify-center">
                       <div className="p-1 bg-green-100 rounded-full">
                         <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                         </svg>
                       </div>
                       <p className="ml-1 font-medium text-xs text-gray-700">Área do Amador</p>
                     </div>
                   </Link>
                 </div>
               </div>

               <div>
                 <h4 className="font-bold text-gray-900 mb-1 px-1 text-sm">Futebot</h4>
                 <div className="grid grid-cols-2 gap-2">
                   <a href="https://wa.me/554896265397" target="_blank" rel="noopener noreferrer" className="group block p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                     <div className="flex items-center justify-center">
                       <div className="p-1 bg-green-100 rounded-full">
                         <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                         </svg>
                       </div>
                       <p className="ml-1 font-medium text-xs text-gray-700">WhatsApp</p>
                     </div>
                   </a>

                   <Link href="/futebot" className="group block p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                     <div className="flex items-center justify-center">
                       <div className="p-1 bg-blue-100 rounded-full">
                         <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                         </svg>
                       </div>
                       <p className="ml-1 font-medium text-xs text-gray-700">Chat</p>
                     </div>
                   </Link>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
