import { notFound } from 'next/navigation';
import { TopScorersTable, TopScorer } from '@/components/TopScorersTable';
import { getApiUrl } from '@/lib/config';

type Props = {
  params: { competitionSlug: string };
};

async function getTopScorersForCompetition(slug: string): Promise<{ topScorers: TopScorer[], competitionName: string }> {
  const API_URL = getApiUrl();
  
  try {
    // Buscar todas as competições
    const allCompetitionsRes = await fetch(`${API_URL}/competitions`, { 
      next: { revalidate: 60 },
      headers: { 'Content-Type': 'application/json' }
    });

    if (!allCompetitionsRes.ok) {
      console.error('Failed to fetch competitions.');
      return { topScorers: [], competitionName: '' };
    }

    const allCompetitions: {id: number, slug: string, name: string, category?: string}[] = await allCompetitionsRes.json();
    const currentCompetition = allCompetitions.find(c => c.slug === slug);
    
    if (!currentCompetition) {
      notFound();
    }

    // Verificar se é uma competição amadora
    if (currentCompetition.category === 'amateur') {
      // Usar API de artilheiros amadores
      const amateurTopScorersRes = await fetch(`${API_URL}/amateur/top-scorers/${currentCompetition.id}`, { 
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' }
      });

      if (amateurTopScorersRes.ok) {
        const amateurTopScorers: any[] = await amateurTopScorersRes.json();
        
        // Converter formato dos artilheiros amadores para o formato esperado
        const topScorers = amateurTopScorers.map(scorer => ({
          player: {
            id: scorer.player_id,
            name: scorer.player_name,
            position: 'Atacante', // Valor padrão
            image_url: scorer.player_image || ''
          },
          team: {
            id: scorer.team_id,
            name: scorer.team_name,
            logo_url: scorer.team_logo || ''
          },
          goals: scorer.goals
        }));

        return { 
          topScorers,
          competitionName: currentCompetition.name
        };
      }
    } else {
      // Usar API de artilheiros profissionais
      const allTopScorersRes = await fetch(`${API_URL}/matches/top-scorers`, { 
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' }
      });

      if (allTopScorersRes.ok) {
        const allTopScorers: any[] = await allTopScorersRes.json();
        
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
      }
    }

    return { topScorers: [], competitionName: currentCompetition.name };
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