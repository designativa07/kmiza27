import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';
import { getCdnImageUrl, getCompetitionLogoUrl } from '@/lib/cdn-simple';
import { CompetitionSwitcher } from '@/components/CompetitionSwitcher';

// 1. Definir a interface para o tipo Competition
interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
}

// 2. Definir a URL da API (idealmente viria de variáveis de ambiente)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getCompetitions(): Promise<Competition[]> {
  try {
    const res = await fetch(`${API_URL}/competitions?active=true`, { 
      cache: 'no-store' // Força a busca de dados a cada requisição
    });
    if (!res.ok) {
      console.error(`Error fetching competitions: ${res.statusText}`);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    return [];
  }
}

export default async function Home() {
  const competitions = await getCompetitions();

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Futepédia Kmiza27</h1>
          <p className="text-md text-gray-600 mt-1">Informações sobre futebol</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {competitions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {competitions.map((competition) => (
              <div key={competition.id} className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex items-center space-x-4 mb-4">
                    {competition.logo_url ? (
                      <img 
                        src={getCompetitionLogoUrl(competition.logo_url)}
                        alt={`${competition.name} logo`}
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                        <Shield className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <h2 className="text-lg font-semibold text-gray-800 flex-1">{competition.name}</h2>
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                    <Link href={`/${competition.slug}/classificacao`} className="flex items-center justify-between text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                      Ver Classificação
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href={`/${competition.slug}/jogos`} className="flex items-center justify-between text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                      Ver Jogos
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Nenhum campeonato ativo</h3>
            <p className="mt-1 text-sm text-gray-500">
              Não há campeonatos ativos no momento. Por favor, volte mais tarde.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
