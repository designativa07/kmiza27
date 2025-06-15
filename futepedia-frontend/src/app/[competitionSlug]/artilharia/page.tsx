import { notFound } from 'next/navigation';
import { TopScorersTable, TopScorer } from '@/components/TopScorersTable';

type Props = {
  params: { competitionSlug: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function getTopScorers(slug: string): Promise<TopScorer[]> {
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { next: { revalidate: 60 } });
  if (!competitionResponse.ok) {
    notFound();
  }
  const competition: { id: number } = await competitionResponse.json();

  const topScorersResponse = await fetch(`${API_URL}/competitions/${competition.id}/top-scorers`, { next: { revalidate: 60 } });
  if (!topScorersResponse.ok) {
    // Retorna array vazio em caso de erro para não quebrar a página,
    // o componente da tabela pode lidar com o estado de vazio.
    return [];
  }
  
  return topScorersResponse.json();
}

export default async function TopScorersPage({ params }: Props) {
  const topScorers = await getTopScorers(params.competitionSlug);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <TopScorersTable topScorers={topScorers} />
    </div>
  );
} 