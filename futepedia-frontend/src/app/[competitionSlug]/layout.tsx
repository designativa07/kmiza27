import { ChevronLeft, Home } from 'lucide-react';
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
    { name: 'Artilharia', href: `/${competition.slug}/artilharia` },
    { name: 'Estádios', href: `/${competition.slug}/estadios` },
    // Descomente quando as páginas estiverem prontas
    // { name: 'Partidas', href: `/${competition.slug}/partidas` },
    // { name: 'Estatísticas', href: `/${competition.slug}/estatisticas` },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                <ClientOnly fallback={
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Todos os Campeonatos</span>
                  </div>
                }>
                  <CompetitionSwitcher currentCompetitionName={competition.name} />
                </ClientOnly>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{competition.name}</h1>
              </div>
            </div>
            <Link 
              href="/" 
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
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