'use client';

import React from 'react';
import { Globe, Tv, Radio } from 'lucide-react';
import InlineVideoPlayer from './InlineVideoPlayer';

interface MatchBroadcastSectionProps {
  match: {
    broadcast_channels?: string[] | string | null;
    broadcasts?: Array<{
      id: number;
      channel: {
        id: number;
        name: string;
        channel_link?: string;
        active: boolean;
      };
    }> | null;
    home_team: { name: string };
    away_team: { name: string };
  };
}

const MatchBroadcastSection: React.FC<MatchBroadcastSectionProps> = ({ match }) => {
  // Função para processar broadcast_channels (pode ser string, array ou null)
  const processBroadcastChannels = (channels: string[] | string | null): string[] => {
    if (!channels) return [];
    if (Array.isArray(channels)) return channels;
    if (typeof channels === 'string') {
      try {
        // Tentar fazer parse se for JSON string
        const parsed = JSON.parse(channels);
        return Array.isArray(parsed) ? parsed : [channels];
      } catch {
        // Se não for JSON válido, tratar como string simples
        return [channels];
      }
    }
    return [];
  };

  // Função para processar broadcasts (canais tradicionais de TV/rádio)
  const processBroadcasts = (broadcasts: Array<{
    id: number;
    channel: {
      id: number;
      name: string;
      channel_link?: string;
      active: boolean;
    };
  }> | null): Array<{ name: string; link?: string }> => {
    if (!broadcasts) return [];
    if (Array.isArray(broadcasts)) {
      return broadcasts.map(broadcast => ({
        name: broadcast.channel.name,
        link: broadcast.channel.channel_link
      }));
    }
    return [];
  };

  const broadcastChannels = processBroadcastChannels(match.broadcast_channels || null);
  const broadcasts = processBroadcasts(match.broadcasts || null);
  const homeTeamName = match.home_team.name;
  const awayTeamName = match.away_team.name;

  // Verificar se há streams de vídeo online
  const hasVideoStreams = broadcastChannels.length > 0;
  const hasTraditionalBroadcasts = broadcasts.length > 0;

  // Se não há nenhuma transmissão, não mostrar a seção
  if (!hasVideoStreams && !hasTraditionalBroadcasts) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Tv className="h-5 w-5 mr-2 text-blue-600" />
        Transmissão
      </h3>

      <div className="space-y-6">
        {/* Streams de Vídeo Online */}
        {hasVideoStreams && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 flex items-center mb-3">
              <Globe className="h-4 w-4 mr-2 text-blue-600" />
              Assistir ao Vivo Online
            </h4>

            <div className="space-y-3">
              {broadcastChannels.map((channel, index) => (
                <InlineVideoPlayer
                  key={index}
                  url={channel}
                  title={`${homeTeamName} x ${awayTeamName} - Transmissão`}
                  className="w-full"
                />
              ))}
            </div>
          </div>
        )}

        {/* Canais Tradicionais de TV/Rádio */}
        {hasTraditionalBroadcasts && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 flex items-center mb-3">
              <Radio className="h-4 w-4 mr-2 text-green-600" />
              Canais de TV e Rádio
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {broadcasts.map((channel, index) => (
                <div key={index}>
                  {channel.link ? (
                    <a
                      href={channel.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 rounded-lg px-3 py-2 text-center transition-colors"
                    >
                      <span className="text-sm font-medium">{channel.name}</span>
                    </a>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
                      <span className="text-sm font-medium text-gray-700">{channel.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchBroadcastSection;
