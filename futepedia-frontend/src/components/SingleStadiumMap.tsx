'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

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

// Provedores de tiles com fallbacks
const TILE_PROVIDERS = [
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  }
];

export default function SingleStadiumMap({ stadium, height = 'h-64' }: SingleStadiumMapProps) {
  const [currentProviderIndex, setCurrentProviderIndex] = useState(0);
  const [tileErrors, setTileErrors] = useState(0);
  const [showStaticFallback, setShowStaticFallback] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout>();

  // Se não tiver coordenadas válidas, não mostrar o mapa
  if (!stadium.latitude || !stadium.longitude ||
      isNaN(stadium.latitude) || isNaN(stadium.longitude) ||
      stadium.latitude < -90 || stadium.latitude > 90 ||
      stadium.longitude < -180 || stadium.longitude > 180) {
    return (
      <div className={`${height} bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-500">Localização não disponível</p>
        </div>
      </div>
    );
  }

  const position: [number, number] = [stadium.latitude, stadium.longitude];
  const currentProvider = TILE_PROVIDERS[currentProviderIndex];

  // Silenciar erros de tiles no console
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      // Silenciar erros relacionados a tiles
      const message = args.join(' ');
      if (message.includes('tile') || 
          message.includes('ERR_CONNECTION_RESET') ||
          message.includes('Failed to fetch') ||
          message.includes('net::') ||
          message.includes('openstreetmap') ||
          message.includes('cartocdn') ||
          message.includes('opentopomap') ||
          message.includes('.png')) {
        return; // Não exibir o erro
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Detectar erros de tiles e fazer fallback mais rapidamente
  useEffect(() => {
    if (tileErrors > 3) { // Reduzido de 5 para 3 para ser mais responsivo
      if (currentProviderIndex < TILE_PROVIDERS.length - 1) {
        // Tentar próximo provedor
        setCurrentProviderIndex(prev => prev + 1);
        setTileErrors(0);
      } else {
        // Todos os provedores falharam, mostrar fallback estático
        setShowStaticFallback(true);
      }
    }
  }, [tileErrors, currentProviderIndex]);

  // Timer de fallback - se o mapa não carregar em 10 segundos, mostrar fallback
  useEffect(() => {
    fallbackTimerRef.current = setTimeout(() => {
      if (!mapReady) {
        setShowStaticFallback(true);
      }
    }, 10000);

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [mapReady]);

  // Componente de fallback estático
  if (showStaticFallback) {
    return (
      <div className={`${height} bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center border border-gray-200 relative overflow-hidden`}>
        <div className="text-center z-10">
          <div className="text-4xl mb-2">🏟️</div>
          <div className="font-bold text-lg text-gray-800">{stadium.name}</div>
          {stadium.city && (
            <div className="text-gray-600">
              {stadium.city}{stadium.state && `, ${stadium.state}`}
            </div>
          )}
          <div className="text-sm text-gray-500 mt-2">
            📍 {stadium.latitude.toFixed(4)}, {stadium.longitude.toFixed(4)}
          </div>
          {stadium.capacity && (
            <div className="text-sm text-gray-500">
              👥 {stadium.capacity.toLocaleString()} pessoas
            </div>
          )}
          <div className="text-xs text-gray-400 mt-2">
            Mapa não disponível no momento
          </div>
        </div>
        
        {/* Elementos decorativos para simular um mapa */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-8 h-8 border-2 border-blue-400 rounded-full"></div>
          <div className="absolute top-8 right-6 w-6 h-6 border-2 border-green-400 rounded-full"></div>
          <div className="absolute bottom-6 left-8 w-4 h-4 border-2 border-red-400 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-10 h-2 border-t-2 border-gray-400"></div>
          <div className="absolute top-12 left-12 w-2 h-8 border-l-2 border-gray-400"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full z-20"></div>
        </div>
      </div>
    );
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
          key={`${currentProvider.name}-${currentProviderIndex}`}
          url={currentProvider.url}
          attribution={currentProvider.attribution}
          eventHandlers={{
            tileerror: () => {
              setTileErrors(prev => prev + 1);
            },
            tileload: () => {
              setMapReady(true);
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