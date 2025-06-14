import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
}

async function getCompetition(slug: string): Promise<Competition | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/competitions/slug/${slug}`, {
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
    // Descomente quando as páginas estiverem prontas
    // { name: 'Artilharia', href: `/${competition.slug}/artilharia` },
    // { name: 'Partidas', href: `/${competition.slug}/partidas` },
    // { name: 'Estatísticas', href: `/${competition.slug}/estatisticas` },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            {competition.logo_url && (
              <img src={competition.logo_url} alt={`${competition.name} logo`} className="h-12 w-12 object-contain" />
            )}
            <div>
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Todos os Campeonatos
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
            </div>
          </div>
          <nav className="mt-4 -mb-4 border-b border-gray-200">
            <div className="flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="pb-3 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  // TODO: Add active link styling
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 