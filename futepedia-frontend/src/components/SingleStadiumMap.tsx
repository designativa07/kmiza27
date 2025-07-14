'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Importar dinamicamente o mapa para evitar problemas de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface Stadium {
  id: number;
  name: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  capacity?: number;
}

interface SingleStadiumMapProps {
  stadium: Stadium;
  height?: string;
}

// Componente de fallback para quando não há mapa
const MapFallback = ({ height, message }: { height: string; message: string }) => (
  <div className={`${height} bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200`}>
    <div className="text-center">
      <div className="text-4xl mb-2">🗺️</div>
      <p className="text-gray-500">{message}</p>
    </div>
  </div>
);

export default function SingleStadiumMap({ stadium, height = 'h-64' }: SingleStadiumMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Configurar ícones do Leaflet após o carregamento do cliente
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        // Configurar ícones padrão do Leaflet usando CDN
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      }).catch(() => {
        console.error('Erro ao carregar Leaflet');
        setMapError(true);
      });
    }
  }, []);

  // Se não tiver coordenadas válidas, não mostrar o mapa
  if (!stadium.latitude || !stadium.longitude ||
      isNaN(stadium.latitude) || isNaN(stadium.longitude) ||
      stadium.latitude < -90 || stadium.latitude > 90 ||
      stadium.longitude < -180 || stadium.longitude > 180) {
    return <MapFallback height={height} message="Localização não disponível" />;
  }

  if (mapError) {
    return <MapFallback height={height} message="Erro ao carregar mapa" />;
  }

  const position: [number, number] = [stadium.latitude, stadium.longitude];

  if (typeof window === 'undefined') {
    return <MapFallback height={height} message="Carregando mapa..." />;
  }

  return (
    <div className={`${height} w-full rounded-lg overflow-hidden border border-gray-200`}>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        zoomControl={true}
        className="h-full w-full"
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{
            tileerror: (error) => {
              console.warn('Erro ao carregar tile do mapa:', error);
            }
          }}
        />
        
        <Marker position={position}>
          <Popup>
            <div className="text-center">
              <div className="font-bold text-lg">{stadium.name}</div>
              {stadium.city && (
                <div className="text-gray-600">
                  {stadium.city}{stadium.state && `, ${stadium.state}`}
                </div>
              )}
              {stadium.capacity && (
                <div className="text-sm text-gray-500 mt-1">
                  Capacidade: {stadium.capacity.toLocaleString()} pessoas
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
} 