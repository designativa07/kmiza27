import { ChevronLeft, Home, Search } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CompetitionSwitcher } from '@/components/CompetitionSwitcher';
import { NavLinks } from '@/components/NavLinks';
import ClientOnly from '@/components/ClientOnly';
import { getCompetitionLogoUrl } from '@/lib/cdn-simple';
import { getApiUrl } from '@/lib/config';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
}

async function getCompetition(slug: string): Promise<Competition | null> {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/competitions/slug/${slug}`, {
      next: { revalidate: 3600 } // Revalida a cada hora
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch competition:', error);
    return null;
  }
}

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { competitionSlug: string };
}) {
  const competition = await getCompetition(params.competitionSlug);

  if (!competition) {
    notFound();
  }

  const navLinks = [
    { name: 'Classificação', href: `/${competition.slug}/classificacao` },
    { name: 'Jogos', href: `/${competition.slug}/jogos` },
    { name: 'Chaveamento', href: `/${competition.slug}/chaveamento` },
    { name: 'Artilharia', href: `/${competition.slug}/artilharia` },
    { name: 'Estádios', href: `/${competition.slug}/estadios` },
    // Descomente quando as páginas estiverem prontas
    // { name: 'Estatísticas', href: `/${competition.slug}/estatisticas` },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {competition.logo_url && (
                <img 
                  src={getCompetitionLogoUrl(competition.logo_url)}
                  alt={`${competition.name} logo`}
                  className="h-12 w-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mt-1">{competition.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ClientOnly fallback={
                <div className="flex items-center text-sm text-gray-500">
                  <span>Carregando Campeonatos...</span>
                </div>
              }>
                <CompetitionSwitcher currentCompetitionName={competition.name} />
              </ClientOnly>
              <Link 
                href="/" 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
              >
                <Home className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <NavLinks links={navLinks} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 