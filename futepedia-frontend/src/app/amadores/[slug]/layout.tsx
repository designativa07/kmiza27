import { notFound } from 'next/navigation';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { NavLinks } from '@/components/NavLinks';
import { getApiUrl } from '@/lib/config';
import { ListOrdered, CalendarDays, Target, Users } from 'lucide-react';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  type?: string;
}

async function getAmateurCompetition(slug: string): Promise<Competition | null> {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/amateur/competitions/slug/${slug}`, {
      next: { revalidate: 3600 } // Revalida a cada hora
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch amateur competition:', error);
    return null;
  }
}

export default async function AmateurCompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const competition = await getAmateurCompetition(params.slug);

  if (!competition) {
    notFound();
  }

  // Definir abas para competições amadoras
  const navLinks = [
    { name: 'Classificação', href: `/amadores/${competition.slug}/classificacao`, icon: <ListOrdered className="h-4 w-4" /> },
    { name: 'Jogos', href: `/amadores/${competition.slug}/jogos`, icon: <CalendarDays className="h-4 w-4" /> },
    { name: 'Artilharia', href: `/amadores/${competition.slug}/artilharia`, icon: <Target className="h-4 w-4" /> },
    { name: 'Jogadores', href: `/amadores/${competition.slug}/jogadores`, icon: <Users className="h-4 w-4" /> },
  ];

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