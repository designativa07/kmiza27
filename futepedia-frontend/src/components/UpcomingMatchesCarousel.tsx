'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Clock, ArrowRight, ArrowUpRight } from 'lucide-react';
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
    // Ajustar número de jogos visíveis baseado no tamanho da tela
    const updateVisibleCount = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1); // Mobile: 1 jogo
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2); // Tablet: 2 jogos
      } else {
        setVisibleCount(3); // Desktop: 3 jogos
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
          className={`absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center z-10 transition-colors ${
            canGoPrev 
              ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer' 
              : 'bg-gray-50 cursor-not-allowed opacity-50'
          }`}
          aria-label="Jogos anteriores"
        >
          <ChevronLeft className={`h-5 w-5 ${canGoPrev ? 'text-gray-600' : 'text-gray-400'}`} />
        </button>

        {/* Botão Próximo - Sempre visível, desativado quando não pode navegar */}
        <button
          onClick={nextSlide}
          disabled={!canGoNext}
          className={`absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center z-10 transition-colors ${
            canGoNext 
              ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer' 
              : 'bg-gray-50 cursor-not-allowed opacity-50'
          }`}
          aria-label="Próximos jogos"
        >
          <ChevronRight className={`h-5 w-5 ${canGoNext ? 'text-gray-600' : 'text-gray-400'}`} />
        </button>

        {/* Container do carrossel com padding interno */}
        <div className="px-8">
          {/* Carrossel de Jogos com animação */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translateX(-${currentIndex * 224}px)`
              }}
            >
              {matches.map((match, index) => (
                <div key={match.id} className="w-56 flex-shrink-0 relative">
                  <Link 
                    href={`/jogos/${match.id}`}
                    className="block bg-gray-50 p-3 hover:bg-white transition-colors cursor-pointer"
                  >
                    {/* Cabeçalho com competição */}
                    <div className="flex items-center justify-center mb-3">
                      <div className="flex items-center space-x-2">
                        <ImageWithFallback
                          src={match.competition.logo_url}
                          alt={match.competition.name}
                          fallbackType="competition"
                          size="xs"
                          className="h-4 w-4"
                        />
                        <span className="text-xs text-gray-600 font-medium truncate">
                          {match.competition.name}
                        </span>
                      </div>
                    </div>

                    {/* Times na mesma linha */}
                    <div className="flex items-center justify-center mb-3">
                      {/* Time da Casa */}
                      <div className="flex items-center space-x-2 flex-1 justify-end">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {match.home_team.short_name || match.home_team.name}
                        </span>
                        <ImageWithFallback
                          src={match.home_team.logo_url}
                          alt={match.home_team.name}
                          fallbackType="team"
                          size="xs"
                          className="h-6 w-6 flex-shrink-0"
                        />
                      </div>

                      {/* VS */}
                      <div className="mx-4">
                        <span className="text-xs text-gray-400 font-medium">VS</span>
                      </div>

                      {/* Time Visitante */}
                      <div className="flex items-center space-x-2 flex-1 justify-start">
                        <ImageWithFallback
                          src={match.away_team.logo_url}
                          alt={match.away_team.name}
                          fallbackType="team"
                          size="xs"
                          className="h-6 w-6 flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900 truncate">
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
