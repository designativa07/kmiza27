import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Stadium } from '@/types/stadium';
import { MapPin, Users, Calendar, FileText, Building } from 'lucide-react';
import { getStadiumImageUrl } from '@/lib/cdn';
import Link from 'next/link';

type Props = {
  params: { competitionSlug: string };
};

interface Competition {
  id: number;
  name: string;
  slug: string;
  season: string;
  country?: string;
  logo_url?: string;
}

interface Match {
  id: number;
  match_date: string;
  home_team: { id: number; name: string };
  away_team: { id: number; name: string };
  stadium?: Stadium;
}

function safeCoordinates(lat: any, lng: any): { latitude: number; longitude: number } | null {
  const latitude = Number(lat);
  const longitude = Number(lng);
  
  if (isNaN(latitude) || isNaN(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
    return null;
  }
  
  return { latitude, longitude };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

const StadiumCard = ({ stadium }: { stadium: Stadium }) => {
  // Função para truncar texto de história
  const truncateHistory = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Link href={`/estadio/${stadium.id}`} className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="bg-gray-100 h-32 flex items-center justify-center relative">
        {stadium.image_url ? (
          <img 
            src={getStadiumImageUrl(stadium.image_url)} 
            alt={stadium.name} 
            className="h-full w-full object-cover"
          />
        ) : (
          <Building className="h-12 w-12 text-gray-400" />
        )}
      </div>
      <div className="p-4">
        <h4 className="font-bold text-gray-900 mb-2 text-sm leading-tight">{stadium.name}</h4>
        
        <div className="space-y-1 text-xs text-gray-600 mb-3">
          {stadium.city && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span>
                {stadium.city}{stadium.state && `, ${stadium.state}`}
              </span>
            </div>
          )}
          
          {stadium.capacity && (
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span>{stadium.capacity.toLocaleString()} pessoas</span>
            </div>
          )}
          
          {stadium.opened_year && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>Inaugurado em {stadium.opened_year}</span>
            </div>
          )}
          

        </div>
        
        {stadium.history && (
          <div className="border-t border-gray-100 pt-2">
            <div className="flex items-start space-x-1">
              <FileText className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                {truncateHistory(stadium.history)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

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
                <StadiumCard key={stadium.id} stadium={stadium} />
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