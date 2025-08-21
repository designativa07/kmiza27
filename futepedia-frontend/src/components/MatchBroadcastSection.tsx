'use client';

import { useState } from 'react';
import { TrendingUp, Tv, Globe, Plus, X } from 'lucide-react';
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
  const [additionalLinks, setAdditionalLinks] = useState<string[]>([]);
  const [newLinkInput, setNewLinkInput] = useState('');
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);

  const hasVideoStreams = broadcastChannels && processBroadcastChannels(broadcastChannels).length > 0;
  const hasTvChannels = broadcasts && broadcasts.length > 0;
  const hasAnyBroadcast = hasVideoStreams || hasTvChannels || additionalLinks.length > 0;

  const handleAddLink = () => {
    if (newLinkInput.trim()) {
      setAdditionalLinks([...additionalLinks, newLinkInput.trim()]);
      setNewLinkInput('');
      setShowAddLinkForm(false);
    }
  };

  const handleRemoveLink = (index: number) => {
    setAdditionalLinks(additionalLinks.filter((_, i) => i !== index));
  };

  const handleRemoveOriginalLink = (index: number) => {
    // Aqui você pode implementar a lógica para remover links originais
    // Por enquanto, apenas remove do estado local
    console.log('Remover link original:', index);
  };

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
                  {(hasVideoStreams || additionalLinks.length > 0) && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-blue-600" />
                          Assistir ao Vivo Online
                        </h4>
                        <button
                          onClick={() => setShowAddLinkForm(!showAddLinkForm)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          +LINK
                        </button>
                      </div>

                      {/* Formulário para adicionar novo link */}
                      {showAddLinkForm && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2">
                            <input
                              type="url"
                              value={newLinkInput}
                              onChange={(e) => setNewLinkInput(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={handleAddLink}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                            >
                              Adicionar
                            </button>
                            <button
                              onClick={() => {
                                setShowAddLinkForm(false);
                                setNewLinkInput('');
                              }}
                              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Links originais */}
                        {hasVideoStreams && processBroadcastChannels(broadcastChannels).map((channel, index) => (
                          <div key={`original-${index}`} className="relative">
                            <InlineVideoPlayer 
                              url={channel} 
                              title={`${homeTeamName} x ${awayTeamName} - Transmissão`}
                              className="w-full"
                            />
                            <button
                              onClick={() => handleRemoveOriginalLink(index)}
                              className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                              title="Remover link"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}

                        {/* Links adicionais */}
                        {additionalLinks.map((link, index) => (
                          <div key={`additional-${index}`} className="relative">
                            <InlineVideoPlayer 
                              url={link} 
                              title={`${homeTeamName} x ${awayTeamName} - Transmissão`}
                              className="w-full"
                            />
                            <button
                              onClick={() => handleRemoveLink(index)}
                              className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                              title="Remover link"
                            >
                              <X className="h-3 w-3" />
                            </button>
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
