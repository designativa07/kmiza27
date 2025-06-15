import { notFound } from 'next/navigation';
import { TopScorersTable, TopScorer } from '@/components/TopScorersTable';

type Props = {
  params: { competitionSlug: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function getTopScorersForCompetition(slug: string): Promise<TopScorer[]> {
  const [allCompetitionsRes, allTopScorersRes] = await Promise.all([
    fetch(`${API_URL}/competitions`, { next: { revalidate: 60 } }),
    fetch(`${API_URL}/matches/top-scorers`, { next: { revalidate: 60 } }),
  ]);

  if (!allCompetitionsRes.ok || !allTopScorersRes.ok) {
    console.error('Failed to fetch data for top scorers page.');
    return [];
  }

  const allCompetitions: {id: number, slug: string}[] = await allCompetitionsRes.json();
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
  
  return competitionTopScorers;
}

export default async function TopScorersPage({ params }: Props) {
  const topScorers = await getTopScorersForCompetition(params.competitionSlug);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <TopScorersTable topScorers={topScorers} />
    </div>
  );
} 