'use client';

import { useState, useEffect } from 'react';
import { Play, ExternalLink, X } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  className?: string;
}

interface VideoEmbedInfo {
  type: 'youtube' | 'vimeo' | 'twitch' | 'other';
  embedUrl: string;
  originalUrl: string;
}

export default function VideoPlayer({ url, title = 'Transmissão ao Vivo', className = '' }: VideoPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  if (!embedInfo) {
    return null;
  }

  // Se for YouTube, Vimeo ou Twitch, mostrar player embedável
  if (['youtube', 'vimeo', 'twitch'].includes(embedInfo.type)) {
    return (
      <div className={`${className}`}>
        {/* Botão para expandir */}
        <button
          onClick={handleExpand}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
        >
          <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span>ASSISTIR AO VIVO</span>
        </button>

        {/* Modal expandido */}
        {isExpanded && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header do modal */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Fechar player de vídeo"
                  aria-label="Fechar player de vídeo"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Player de vídeo */}
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
              
              {/* Footer com link original */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <a
                  href={embedInfo.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Abrir em nova aba
                </a>
              </div>
            </div>
          </div>
        )}
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
