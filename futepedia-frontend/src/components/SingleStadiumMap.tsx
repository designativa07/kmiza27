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

// Mapa estático simples como fallback adicional
const StaticMapFallback = ({ stadium, height }: { stadium: Stadium; height: string }) => (
  <div className={`${height} bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center border border-gray-200 relative overflow-hidden`}>
    <div className="text-center z-10">
      <div className="text-5xl mb-3">🗺️</div>
      <h3 className="font-bold text-gray-800 mb-1">{stadium.name}</h3>
      {stadium.city && (
        <p className="text-sm text-gray-600 mb-2">{stadium.city}{stadium.state && `, ${stadium.state}`}</p>
      )}
      <div className="bg-white bg-opacity-80 rounded-lg px-3 py-2 inline-block">
        <p className="text-xs text-gray-700 font-medium">
          📍 {stadium.latitude?.toFixed(4)}, {stadium.longitude?.toFixed(4)}
        </p>
        <p className="text-xs text-gray-500 mt-1">Localização do estádio</p>
      </div>
    </div>
    {/* Padrão decorativo de fundo */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-4 left-4 w-6 h-6 bg-blue-400 rounded-full"></div>
      <div className="absolute top-8 right-6 w-4 h-4 bg-indigo-500 rounded-full"></div>
      <div className="absolute bottom-6 left-8 w-8 h-8 bg-blue-300 rounded-full"></div>
      <div className="absolute bottom-4 right-4 w-5 h-5 bg-indigo-400 rounded-full"></div>
      <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-blue-200 rounded-full"></div>
      <div className="absolute top-1/3 right-1/3 w-7 h-7 bg-indigo-300 rounded-full"></div>
    </div>
  </div>
);

export default function SingleStadiumMap({ stadium, height = 'h-64' }: SingleStadiumMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [tileErrors, setTileErrors] = useState(0);
  const [tileProvider, setTileProvider] = useState(0); // 0 = OSM, 1 = Fallback

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
        setMapReady(true);
      }).catch(() => {
        console.error('Erro ao carregar Leaflet');
        setMapError(true);
      });
    }

    // Timeout para evitar loading infinito
    const timer = setTimeout(() => {
      if (!mapReady && !mapError) {
        setMapError(true);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, [mapReady, mapError]);

  // Se não tiver coordenadas válidas, não mostrar o mapa
  if (!stadium.latitude || !stadium.longitude ||
      isNaN(stadium.latitude) || isNaN(stadium.longitude) ||
      stadium.latitude < -90 || stadium.latitude > 90 ||
      stadium.longitude < -180 || stadium.longitude > 180) {
    return <MapFallback height={height} message="Localização não disponível" />;
  }

  if (mapError) {
    return <MapFallback height={height} message="Mapa temporariamente indisponível" />;
  }

  if (tileErrors > 8) {
    return <StaticMapFallback stadium={stadium} height={height} />;
  }

  const position: [number, number] = [stadium.latitude, stadium.longitude];

  // Configurar provedor de tiles baseado no estado
  const tileProviders = [
    {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: ['a', 'b', 'c']
    },
    {
      url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
      attribution: '&copy; CartoDB',
      subdomains: ['a', 'b', 'c', 'd']
    }
  ];

  const currentProvider = tileProviders[tileProvider] || tileProviders[0];

  if (typeof window === 'undefined' || !mapReady) {
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
        style={{ backgroundColor: '#f5f5f5' }}
        whenReady={() => setMapReady(true)}
        attributionControl={false}
      >
        <TileLayer
          key={`${tileProvider}-${currentProvider.url}`}
          url={currentProvider.url}
          attribution={currentProvider.attribution}
          maxZoom={17}
          minZoom={10}
          subdomains={currentProvider.subdomains}
          keepBuffer={2}
          updateWhenZooming={false}
          errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
          eventHandlers={{
            tileerror: () => {
              setTileErrors(prev => {
                const newCount = prev + 1;
                
                // Trocar para próximo provedor após 3 erros
                if (newCount >= 3 && tileProvider === 0) {
                  console.log('Trocando para provedor de tiles alternativo...');
                  setTileProvider(1);
                  return 0; // Reset contador
                }
                
                // Silenciar erros excessivos no console
                if (newCount < 2) {
                  console.warn(`Problemas de conectividade com tiles (Provider ${tileProvider + 1})`);
                }
                
                return newCount;
              });
            },
            tileload: () => {
              // Reset contador quando tiles carregam com sucesso
              setTileErrors(prev => {
                if (prev > 0) {
                  return Math.max(0, prev - 1);
                }
                return prev;
              });
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