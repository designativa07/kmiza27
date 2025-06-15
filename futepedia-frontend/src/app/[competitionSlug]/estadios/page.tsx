import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Stadium } from '@/types/stadium';

type Props = {
  params: { competitionSlug: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getStadiums(slug: string): Promise<Stadium[]> {
  // A API atual não filtra estádios por competição. Buscaremos todos.
  // No futuro, um endpoint GET /competitions/:id/stadiums seria ideal.
  const res = await fetch(`${API_URL}/stadiums`, { next: { revalidate: 3600 } });

  if (!res.ok) {
    console.error('Failed to fetch stadiums');
    return [];
  }
  
  return res.json();
}

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-[600px] bg-gray-200 rounded-lg flex items-center justify-center"><p>Carregando mapa...</p></div>
});


export default async function StadiumsPage({ params }: Props) {
  const stadiums = await getStadiums(params.competitionSlug);

  const stadiumsWithCoords = stadiums.filter(
    (s): s is Stadium & { latitude: number; longitude: number } =>
      s.latitude != null && s.longitude != null,
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Estádios da Competição</h2>
      {stadiumsWithCoords.length > 0 ? (
        <Map stadiums={stadiumsWithCoords} />
      ) : (
         <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-900">Mapa Indisponível</h3>
          <p className="mt-2 text-md text-gray-500">
            Não há dados de localização para os estádios desta competição.
          </p>
        </div>
      )}
    </div>
  );
} 