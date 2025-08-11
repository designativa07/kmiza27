'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { getApiUrl } from '@/lib/config';
import ImageWithFallback from './ImageWithFallback';

interface Match {
  id: number;
  match_date: string;
  home_team: {
    id: number;
    name: string;
    short_name: string;
    logo_url: string | null;
  };
  away_team: {
    id: number;
    name: string;
    short_name: string;
    logo_url: string | null;
  };
  competition: {
    id: number;
    name: string;
    logo_url: string | null;
  };
  status: string;
}

export default function UpcomingMatchesCarousel() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [cardWidth, setCardWidth] = useState(224);
  const NAV_BUTTON_WIDTH = 24; // px, deve corresponder a w-6
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const cancelClickRef = useRef(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const API_URL = getApiUrl();
        const response = await fetch(`${API_URL}/matches/week`);
        if (response.ok) {
          const data = await response.json();
          // Pegar apenas os próximos 10 jogos
          setMatches(data.slice(0, 10));
        }
      } catch (error) {
        console.error('Erro ao buscar próximos jogos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  useEffect(() => {
    // Ajustar número de jogos visíveis e largura do card baseado no tamanho da tela
    const updateVisibleCount = () => {
      if (window.innerWidth < 640) {
        // Mobile: 2 jogos com cards mais estreitos
        setVisibleCount(2);
        setCardWidth(136);
      } else if (window.innerWidth < 1024) {
        // Tablet: 2 jogos com cards médios
        setVisibleCount(2);
        setCardWidth(200);
      } else {
        // Desktop: 3 jogos com cards padrão
        setVisibleCount(3);
        setCardWidth(224);
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  const nextSlide = () => {
    // Garantir que não ultrapasse o limite máximo
    const maxIndex = Math.max(0, matches.length - visibleCount);
    if (currentIndex < maxIndex) {
      // Avançar 2 posições por vez para uma navegação mais eficiente
      const nextIndex = Math.min(currentIndex + 2, maxIndex);
      setCurrentIndex(nextIndex);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      // Voltar 2 posições por vez para uma navegação mais eficiente
      const prevIndex = Math.max(currentIndex - 2, 0);
      setCurrentIndex(prevIndex);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã';
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Próximos Jogos</h2>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  // Calcular o índice máximo correto para evitar cards vazios
  const maxIndex = Math.max(0, matches.length - visibleCount);
  const canGoNext = currentIndex < maxIndex;
  const canGoPrev = currentIndex > 0;

  // Se não há jogos suficientes para navegar, não mostrar botões
  const showNavigation = matches.length > visibleCount;

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="bg-green-100 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-green-700 leading-tight px-4">PRÓXIMOS JOGOS</h2>
          <Link href="/jogos-semana" className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 text-sm font-medium transition-colors flex items-center">
            Ver mais
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="relative">
        {/* Botão Anterior - Sempre visível, desativado quando não pode navegar */}
        <button
          onClick={prevSlide}
          disabled={!canGoPrev}
          className={`absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center z-10 transition-colors ${
            canGoPrev 
              ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer' 
              : 'bg-gray-50 cursor-not-allowed opacity-50'
          }`}
          aria-label="Jogos anteriores"
        >
          <ChevronLeft className={`h-4 w-4 ${canGoPrev ? 'text-gray-600' : 'text-gray-400'}`} />
        </button>

        {/* Botão Próximo - Sempre visível, desativado quando não pode navegar */}
        <button
          onClick={nextSlide}
          disabled={!canGoNext}
          className={`absolute right-0 top-0 bottom-0 w-6 flex items-center justify-center z-10 transition-colors ${
            canGoNext 
              ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer' 
              : 'bg-gray-50 cursor-not-allowed opacity-50'
          }`}
          aria-label="Próximos jogos"
        >
          <ChevronRight className={`h-4 w-4 ${canGoNext ? 'text-gray-600' : 'text-gray-400'}`} />
        </button>

        {/* Container do carrossel com padding interno */}
        <div className="px-0 select-none" style={{ paddingLeft: NAV_BUTTON_WIDTH, paddingRight: NAV_BUTTON_WIDTH }}>
          {/* Carrossel de Jogos com animação */}
          <div className="overflow-hidden">
            <div 
              ref={trackRef}
              className={`flex ${isDragging ? 'transition-none cursor-grabbing' : 'transition-transform duration-300 ease-in-out cursor-grab'} touch-pan-y`}
              style={{ 
                transform: `translateX(${-(currentIndex * cardWidth) + dragDelta}px)`
              }}
              onPointerDown={(e) => {
                setIsDragging(true);
                setDragStartX(e.clientX);
                setDragDelta(0);
                cancelClickRef.current = false;
                try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch {}
              }}
              onPointerMove={(e) => {
                if (!isDragging) return;
                const delta = e.clientX - dragStartX;
                setDragDelta(delta);
                if (Math.abs(delta) > 3) {
                  cancelClickRef.current = true;
                }
              }}
              onPointerUp={(e) => {
                if (!isDragging) return;
                setIsDragging(false);
                const threshold = cardWidth / 3;
                let next = currentIndex;
                if (Math.abs(dragDelta) > threshold) {
                  const moveBy = Math.max(1, Math.round(Math.abs(dragDelta) / cardWidth));
                  // delta negativo -> avança; delta positivo -> volta
                  next = dragDelta < 0 ? currentIndex + moveBy : currentIndex - moveBy;
                }
                const clamped = Math.max(0, Math.min(next, maxIndex));
                setCurrentIndex(clamped);
                setDragDelta(0);
                // Evitar clique após arrasto
                setTimeout(() => { cancelClickRef.current = false; }, 50);
              }}
              onPointerCancel={() => { setIsDragging(false); setDragDelta(0); }}
              onPointerLeave={() => { if (isDragging) { setIsDragging(false); setDragDelta(0); } }}
            >
              {matches.map((match, index) => (
                <div
                  key={match.id}
                  className="flex-shrink-0 relative"
                  style={{ width: `${cardWidth}px` }}
                >
                  <Link 
                    href={`/jogos/${match.id}`}
                    className="block bg-gray-50 p-3 hover:bg-white transition-colors cursor-pointer"
                    draggable={false}
                    onClick={(e) => {
                      if (cancelClickRef.current) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    {/* Cabeçalho com nome da competição (sem logo) */}
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-xs text-gray-600 font-medium truncate">
                        {match.competition.name}
                      </span>
                    </div>

                    {/* Times empilhados (mandante em cima, visitante embaixo) */}
                    <div className="flex flex-col items-center gap-1.5 mb-2">
                      {/* Mandante */}
                      <div className="flex items-center gap-2">
                        <ImageWithFallback
                          src={match.home_team.logo_url}
                          alt={match.home_team.name}
                          fallbackType="team"
                          size="xs"
                          className="h-5 w-5 flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[104px] text-left">
                          {match.home_team.short_name || match.home_team.name}
                        </span>
                      </div>

                      {/* Visitante */}
                      <div className="flex items-center gap-2">
                        <ImageWithFallback
                          src={match.away_team.logo_url}
                          alt={match.away_team.name}
                          fallbackType="team"
                          size="xs"
                          className="h-5 w-5 flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[104px] text-left">
                          {match.away_team.short_name || match.away_team.name}
                        </span>
                      </div>
                    </div>

                    {/* Rodapé com data e horário na mesma linha */}
                    <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(match.match_date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(match.match_date)}</span>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Linha vertical entre os cards (exceto no último) */}
                  {index < matches.length - 1 && (
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
