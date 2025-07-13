import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Stadium } from '@/types/stadium';

type Props = {
  params: { competitionSlug: string };
};

interface Competition {
  id: number;
  name: string;
  slug: string;
}

interface Match {
  id: number;
  stadium: Stadium | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Função helper para converter coordenadas de forma segura
function safeCoordinates(lat: any, lng: any): { latitude: number; longitude: number } | null {
  try {
    const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
    const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;
    
    if (typeof latitude === 'number' && typeof longitude === 'number' && 
        !isNaN(latitude) && !isNaN(longitude) && 
        latitude >= -90 && latitude <= 90 && 
        longitude >= -180 && longitude <= 180) {
      return { latitude, longitude };
    }
    
    return null;
  } catch (error) {
    console.warn('Erro ao converter coordenadas:', error);
    return null;
  }
}

async function getCompetitionStadiums(slug: string): Promise<Stadium[]> {
  try {
    // 1. Buscar informações da competição
    const competitionRes = await fetch(`${API_URL}/competitions/slug/${slug}`, { 
      next: { revalidate: 3600 } 
    });
    
    if (!competitionRes.ok) {
      console.error('Failed to fetch competition');
      return [];
    }
    
    const competition: Competition = await competitionRes.json();
    
    // 2. Buscar todos os jogos da competição
    const matchesRes = await fetch(`${API_URL}/standings/competition/${competition.id}/matches`, { 
      next: { revalidate: 3600 } 
    });

    if (!matchesRes.ok) {
      console.error('Failed to fetch competition matches');
      return [];
    }
    
    const matches: Match[] = await matchesRes.json();
    
    // 3. Extrair estádios únicos dos jogos
    const stadiumsMap = new Map<number, Stadium>();
    
    matches.forEach(match => {
      if (match.stadium && match.stadium.id) {
        stadiumsMap.set(match.stadium.id, match.stadium);
      }
    });
    
    return Array.from(stadiumsMap.values());
    
  } catch (error) {
    console.error('Error fetching competition stadiums:', error);
    return [];
  }
}

const MapComponent = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-[600px] bg-gray-200 rounded-lg flex items-center justify-center"><p>Carregando mapa...</p></div>
});


export default async function StadiumsPage({ params }: Props) {
  const stadiums = await getCompetitionStadiums(params.competitionSlug);

  const stadiumsWithCoords = stadiums.filter(
    (s: Stadium): s is Stadium & { latitude: number; longitude: number } => {
      const coords = safeCoordinates(s.latitude, s.longitude);
      return coords !== null;
    }
  ).map(s => {
    const coords = safeCoordinates(s.latitude, s.longitude)!;
    return {
      ...s,
      latitude: coords.latitude,
      longitude: coords.longitude
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Estádios da Competição</h2>
      {stadiums.length > 0 ? (
        <>
          <div className="mb-6">
            <p className="text-gray-600">
              Encontrados {stadiums.length} estádios utilizados nesta competição.
            </p>
          </div>
          {stadiumsWithCoords.length > 0 ? (
            <MapComponent stadiums={stadiumsWithCoords} />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-900">Mapa Indisponível</h3>
              <p className="mt-2 text-md text-gray-500">
                Os estádios desta competição não possuem coordenadas de localização.
              </p>
            </div>
          )}
          
          {/* Lista de estádios */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Lista de Estádios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stadiums.map((stadium) => (
                <div key={stadium.id} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">{stadium.name}</h4>
                  {stadium.city && (
                    <p className="text-sm text-gray-600 mt-1">{stadium.city}</p>
                  )}
                  {stadium.capacity && (
                    <p className="text-sm text-gray-500 mt-1">
                      Capacidade: {stadium.capacity.toLocaleString()} pessoas
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-900">Nenhum Estádio Encontrado</h3>
          <p className="mt-2 text-md text-gray-500">
            Não há estádios vinculados aos jogos desta competição.
          </p>
        </div>
      )}
    </div>
  );
} 