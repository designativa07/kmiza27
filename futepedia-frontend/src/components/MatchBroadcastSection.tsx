'use client';

import { TrendingUp, Tv, Globe } from 'lucide-react';
import InlineVideoPlayer from './InlineVideoPlayer';

interface MatchBroadcast {
  id: number;
  channel: {
    id: number;
    name: string;
    channel_link?: string;
    active: boolean;
  };
}

interface MatchBroadcastSectionProps {
  broadcasts?: MatchBroadcast[];
  broadcastChannels?: string | string[];
  homeTeamName: string;
  awayTeamName: string;
}

// Função para processar canais de transmissão
function processBroadcastChannels(broadcastChannels: string | string[] | undefined): string[] {
  if (!broadcastChannels) return [];
  
  if (Array.isArray(broadcastChannels)) {
    return broadcastChannels;
  }
  
  if (typeof broadcastChannels === 'string') {
    try {
      // Tentar parse JSON se começar com [ ou "
      if (broadcastChannels.startsWith('[') || broadcastChannels.startsWith('"')) {
        const parsed = JSON.parse(broadcastChannels);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      // Se for string simples, dividir por vírgula
      return broadcastChannels.split(',').map(channel => channel.trim()).filter(Boolean);
    } catch {
      return [broadcastChannels];
    }
  }
  
  return [];
}

export default function MatchBroadcastSection({ 
  broadcasts, 
  broadcastChannels, 
  homeTeamName, 
  awayTeamName 
}: MatchBroadcastSectionProps) {
  const hasVideoStreams = broadcastChannels && processBroadcastChannels(broadcastChannels).length > 0;
  const hasTvChannels = broadcasts && broadcasts.length > 0;
  const hasAnyBroadcast = hasVideoStreams || hasTvChannels;

  if (!hasAnyBroadcast) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Transmissão
        </h3>
        <p className="text-gray-500">A definir</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
        Transmissão
      </h3>
      
      {/* Streams de Vídeo Online */}
      {hasVideoStreams && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Globe className="h-4 w-4 mr-2 text-blue-600" />
            Assistir ao Vivo Online
          </h4>
          <div className="space-y-3">
            {processBroadcastChannels(broadcastChannels).map((channel, index) => (
              <div key={index}>
                <InlineVideoPlayer 
                  url={channel} 
                  title={`${homeTeamName} x ${awayTeamName} - Transmissão`}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
             {/* Canais de TV Tradicionais */}
       {hasTvChannels && (
         <div>
           <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
             <Tv className="h-4 w-4 mr-2 text-indigo-600" />
             Canais de TV
           </h4>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
             {broadcasts.map(({ channel }) => (
               <a
                 key={channel.id}
                 href={channel.channel_link || '#'}
                 target="_blank"
                 rel="noopener noreferrer"
                 className={`inline-block px-3 py-2 rounded-md text-sm font-semibold transition-colors text-center
                   ${channel.channel_link 
                     ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                     : 'bg-gray-200 text-gray-700 cursor-not-allowed'}`}
               >
                 {channel.name}
               </a>
             ))}
           </div>
         </div>
       )}
    </div>
  );
}
