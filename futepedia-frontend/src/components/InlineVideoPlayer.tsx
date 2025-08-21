'use client';

import { useState, useEffect } from 'react';
import { Play, ExternalLink, X } from 'lucide-react';

interface InlineVideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
}

interface VideoEmbedInfo {
  type: 'youtube' | 'vimeo' | 'twitch' | 'globoplay' | 'other';
  embedUrl: string;
  originalUrl: string;
}

export default function InlineVideoPlayer({ url, title = 'Transmissão ao Vivo', className = '' }: InlineVideoPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Começar expandido por padrão
  const [embedInfo, setEmbedInfo] = useState<VideoEmbedInfo | null>(null);

  useEffect(() => {
    if (url) {
      const info = parseVideoUrl(url);
      setEmbedInfo(info);
    }
  }, [url]);

  const parseVideoUrl = (url: string): VideoEmbedInfo => {
    try {
      const urlObj = new URL(url);
      
      // YouTube
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = '';
        
        if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.searchParams.has('v')) {
          videoId = urlObj.searchParams.get('v') || '';
        }
        
        if (videoId) {
          return {
            type: 'youtube',
            embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`,
            originalUrl: url
          };
        }
      }
      
      // Vimeo
      if (urlObj.hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.slice(1);
        if (videoId) {
          return {
            type: 'vimeo',
            embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0`,
            originalUrl: url
          };
        }
      }
      
             // Twitch
       if (urlObj.hostname.includes('twitch.tv')) {
         const pathParts = urlObj.pathname.split('/');
         if (pathParts[1] === 'videos' && pathParts[2]) {
           return {
             type: 'twitch',
             embedUrl: `https://player.twitch.tv/?video=v${pathParts[2]}&parent=${window.location.hostname}`,
             originalUrl: url
           };
         }
       }
       
       // Globoplay - Não suporta embed devido a X-Frame-Options
       if (urlObj.hostname.includes('globoplay.globo.com')) {
         return {
           type: 'globoplay',
           embedUrl: url, // Usar URL original
           originalUrl: url
         };
       }
       
       // Outros serviços
       return {
         type: 'other',
         embedUrl: url,
         originalUrl: url
       };
      
    } catch (error) {
      console.error('Erro ao processar URL do vídeo:', error);
      return {
        type: 'other',
        embedUrl: url,
        originalUrl: url
      };
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  if (!embedInfo) {
    return null;
  }

  // Se for YouTube, Vimeo ou Twitch, mostrar player inline
  if (['youtube', 'vimeo', 'twitch'].includes(embedInfo.type)) {
    return (
      <div className={`${className}`}>
        {/* Player de vídeo inline */}
        {isExpanded && (
          <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedInfo.embedUrl}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
              />
            </div>
            
            {/* Footer com controles e link original */}
            <div className="p-3 bg-gray-800 border-t border-gray-700">
              <div className="flex items-center justify-between">
                {/* Link para abrir em nova aba */}
                <a
                  href={embedInfo.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Abrir em nova aba
                </a>
                
                {/* Botão para ocultar transmissão - menor e à direita */}
                <button
                  onClick={handleToggle}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs font-medium rounded transition-colors"
                >
                  <X className="h-3 w-3 mr-1" />
                  Ocultar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botão para mostrar transmissão quando estiver oculta */}
        {!isExpanded && (
          <button
            onClick={handleToggle}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
          >
            <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span>MOSTRAR TRANSMISSÃO</span>
          </button>
        )}
      </div>
    );
  }

  // Para Globoplay, mostrar mensagem especial
  if (embedInfo.type === 'globoplay') {
    return (
      <div className={`${className}`}>
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-lg">📺 TV Globo</h4>
            <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">Ao Vivo</span>
          </div>
          <p className="text-sm mb-4 opacity-90">
            Este canal não permite reprodução direta no site devido a restrições de direitos autorais.
          </p>
          <a
            href={embedInfo.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white text-orange-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
          >
            <ExternalLink className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span>ASSISTIR NO GLOBOPLAY</span>
          </a>
        </div>
      </div>
    );
  }

  // Para outros tipos, mostrar apenas link direto
  return (
    <div className={`${className}`}>
      <a
        href={embedInfo.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
      >
        <ExternalLink className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span>ASSISTIR</span>
      </a>
    </div>
  );
}
