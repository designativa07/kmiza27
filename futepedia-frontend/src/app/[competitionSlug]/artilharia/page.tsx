import { notFound } from 'next/navigation';
import { TopScorersTable, TopScorer } from '@/components/TopScorersTable';
import { getApiUrl } from '@/lib/config';

type Props = {
  params: { competitionSlug: string };
};

async function getTopScorersForCompetition(slug: string): Promise<{ topScorers: TopScorer[], competitionName: string }> {
  const API_URL = getApiUrl();
  
  try {
    const [allCompetitionsRes, allTopScorersRes] = await Promise.all([
      fetch(`${API_URL}/competitions`, { 
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${API_URL}/matches/top-scorers`, { 
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' }
      }),
    ]);

    if (!allCompetitionsRes.ok || !allTopScorersRes.ok) {
      console.error('Failed to fetch data for top scorers page.');
      return { topScorers: [], competitionName: '' };
    }

    const allCompetitions: {id: number, slug: string, name: string}[] = await allCompetitionsRes.json();
    const allTopScorers: any[] = await allTopScorersRes.json();
    
    const currentCompetition = allCompetitions.find(c => c.slug === slug);
    
    if (!currentCompetition) {
      notFound();
    }

    // Filtrar os artilheiros pela competição atual
    const competitionTopScorers = allTopScorers.filter(
      (scorer: any) => scorer.competition?.id === currentCompetition.id
    );
    
    // Ordenar por gols (a API já deve fazer isso, mas garantimos)
    competitionTopScorers.sort((a, b) => b.goals - a.goals);
    
    return { 
      topScorers: competitionTopScorers,
      competitionName: currentCompetition.name
    };
  } catch (error) {
    console.error('Erro ao buscar dados dos artilheiros:', error);
    return { topScorers: [], competitionName: '' };
  }
}

export default async function TopScorersPage({ params }: Props) {
  try {
    const { topScorers, competitionName } = await getTopScorersForCompetition(params.competitionSlug);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TopScorersTable topScorers={topScorers} competitionName={competitionName} />
      </div>
    );
  } catch (error) {
    console.error('Erro na página de artilheiros:', error);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg text-center py-16">
          <h3 className="text-xl font-medium text-gray-900">Erro ao Carregar Artilheiros</h3>
          <p className="mt-2 text-md text-gray-500">
            Não foi possível carregar os dados dos artilheiros. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }
} 