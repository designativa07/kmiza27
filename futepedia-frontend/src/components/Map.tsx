'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { Stadium } from '@/types/stadium';

interface MapProps {
  stadiums: (Stadium & { latitude: number; longitude: number })[];
}

export default function Map({ stadiums }: MapProps) {
  // Posição central inicial do mapa (ex: centro do Brasil)
  const initialPosition: [number, number] = [-14.235, -51.925];
  
  return (
    <MapContainer
      center={initialPosition}
      zoom={4}
      scrollWheelZoom={false}
      className="h-[600px] w-full rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {stadiums.map(stadium => (
        <Marker key={stadium.id} position={[stadium.latitude, stadium.longitude]}>
          <Popup>
            <div className="font-bold">{stadium.name}</div>
            <div>{stadium.city || 'Cidade não informada'}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 