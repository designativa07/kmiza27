import { notFound } from 'next/navigation';
import { MapPin, Users, Calendar, Building } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { StadiumImage } from '@/components/StadiumImage';
import { getApiUrl } from '@/lib/config';
import dynamic from 'next/dynamic';

// Importar o mapa dinamicamente para evitar problemas de SSR
const SingleStadiumMap = dynamic(() => import('@/components/SingleStadiumMap'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"><p className="text-gray-500">Carregando mapa...</p></div>
});

// Tipos
interface Stadium {
  id: number;
  name: string;
  city: string;
  state?: string;
  country?: string;
  capacity?: number;
  opened_year?: number;
  latitude?: number;
  longitude?: number;
  history?: string;
  image_url?: string;
  url?: string;
}

type Props = {
  params: { stadiumId: string };
};

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

const API_URL = getApiUrl();

async function getStadiumData(stadiumId: string): Promise<Stadium | null> {
  try {
    const res = await fetch(`${API_URL}/stadiums/${stadiumId}`, { 
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Failed to fetch stadium:', error);
    return null;
  }
}

export default async function StadiumPage({ params }: Props) {
  const stadium = await getStadiumData(params.stadiumId);

  if (!stadium) {
    notFound();
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo showBackToHome={true} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header do estádio */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="h-64 md:h-80 bg-gray-200 relative">
            <StadiumImage 
              imageUrl={stadium.image_url} 
              name={stadium.name}
            />
          </div>
          
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
              <Building className="h-8 w-8 mr-3 text-indigo-600" />
              {stadium.name}
            </h1>
            
            {/* Informações básicas em grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {(stadium.city || stadium.state) && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">
                      {stadium.city}{stadium.city && stadium.state ? ', ' : ''}{stadium.state}
                      {stadium.country && stadium.country !== 'Brasil' && `, ${stadium.country}`}
                    </span>
                  </div>
                )}
                
                {stadium.capacity && (
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">
                      Capacidade: {stadium.capacity.toLocaleString()} pessoas
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {stadium.opened_year && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">
                      Inaugurado em {stadium.opened_year}
                    </span>
                  </div>
                )}
                

              </div>
            </div>
          </div>
        </div>

        {/* História do estádio */}
        {stadium.history && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">História</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {stadium.history}
              </p>
            </div>
          </div>
        )}

        {/* Mapa (se houver coordenadas) */}
        {stadium.latitude && stadium.longitude &&
          !isNaN(Number(stadium.latitude)) && !isNaN(Number(stadium.longitude)) &&
          Number(stadium.latitude) >= -90 && Number(stadium.latitude) <= 90 &&
          Number(stadium.longitude) >= -180 && Number(stadium.longitude) <= 180 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-gray-400" />
              Localização
            </h2>
            <SingleStadiumMap 
              stadium={{
                id: stadium.id,
                name: stadium.name,
                city: stadium.city,
                state: stadium.state,
                latitude: Number(stadium.latitude),
                longitude: Number(stadium.longitude),
                capacity: stadium.capacity
              }}
              height="h-64"
            />
          </div>
        )}
      </main>
    </div>
  );
} 