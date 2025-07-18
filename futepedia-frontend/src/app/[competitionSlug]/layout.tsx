import { notFound } from 'next/navigation';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { NavLinks } from '@/components/NavLinks';
import { getApiUrl } from '@/lib/config';
import { ListOrdered, CalendarDays, Star, Building } from 'lucide-react';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  type?: string;
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

  // Verificar se é competição apenas mata-mata (sem grupos)
  const isPureKnockoutCompetition = competition?.type?.toLowerCase() === 'mata_mata' || 
                                   competition?.type?.toLowerCase() === 'torneio' ||
                                   competition?.type?.toLowerCase() === 'knockout';

  // Definir abas baseadas no tipo de competição
  const allNavLinks = [
    { name: 'Tabela', href: `/${competition.slug}/classificacao`, icon: <ListOrdered className="h-4 w-4" /> },
    { name: 'Jogos', href: `/${competition.slug}/jogos`, icon: <CalendarDays className="h-4 w-4" /> },
    { name: 'Artilharia', href: `/${competition.slug}/artilharia`, icon: <Star className="h-4 w-4" /> },
    { name: 'Estádios', href: `/${competition.slug}/estadios`, icon: <Building className="h-4 w-4" /> },
    // Descomente quando as páginas estiverem prontas
    // { name: 'Estatísticas', href: `/${competition.slug}/estatisticas` },
  ];

  // Para competições apenas mata-mata, remover a aba "Tabela"
  // Para competições mistas (grupos + mata-mata), manter a aba "Tabela"
  const navLinks = isPureKnockoutCompetition 
    ? allNavLinks.filter(link => link.name !== 'Tabela')
    : allNavLinks;

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo 
        currentCompetition={{
          name: competition.name,
          slug: competition.slug
        }}
        showBackToHome={true}
      />
      
      {/* Navegação secundária */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <NavLinks links={navLinks} />
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-4">
        {children}
      </main>
    </div>
  );
} 