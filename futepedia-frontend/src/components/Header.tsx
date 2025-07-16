'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Menu, X, Home, Trophy, MapPin, Users, Shield, Building, User, MessageCircle, ListOrdered, Star } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { getApiUrl } from '@/lib/config';
import { getFutepediaLogoUrl } from '@/lib/cdn';
import React from 'react';

interface HeaderProps {
  currentCompetition?: {
    name: string;
    slug: string;
  };
  showBackToHome?: boolean;
  futepediaLogoUrl?: string | null; 
}

interface SearchResult {
  teams: any[];
  players: any[];
  stadiums: any[];
  competitions: any[];
}

const SearchComponent = React.forwardRef<HTMLInputElement, {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}>(({ value, onChange, loading }, ref) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
    </div>
    <input
      ref={ref}
      type="text"
      placeholder="Buscar..."
      className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
      value={value}
      onChange={onChange}
      aria-label="Campo de busca"
    />
    {loading && (
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500" aria-label="Carregando resultados da busca" role="status"></div>
      </div>
    )}
  </div>
));
SearchComponent.displayName = 'SearchComponent';

export function Header({ currentCompetition, showBackToHome = true, futepediaLogoUrl }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedSearchTerm.length < 2) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${getApiUrl()}/search?q=${debouncedSearchTerm}`);
        if (!res.ok) {
          throw new Error(`Search failed with status: ${res.status}`);
        }
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        // Apresenta um estado de erro ou "nenhum resultado" para o usuário.
        setResults({ teams: [], players: [], stadiums: [], competitions: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearchTerm]);

  // Efeito para focar o input de busca mobile
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isMobileSearchOpen]);

  // Efeito para fechar menu e busca
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setResults(null);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const clearSearch = () => {
    setSearchTerm('');
    setResults(null);
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 relative" ref={menuRef}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between md:justify-center h-16">
            
            {/* Left section */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
                  aria-expanded={isMenuOpen ? "true" : "false"}
                  aria-haspopup="true"
                >
                  {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                </button>
                
                {/* Menu dropdown posicionado em relação ao botão */}
                {isMenuOpen && (
                  <nav className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 py-3 min-w-56" role="menu" aria-label="Menu de navegação">
                    {/* Links de navegação */}
                    <div className="space-y-0.5">
                      <a
                        href="https://wa.me/554896265397"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 px-5 py-2.5 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Falar com o Futebot via WhatsApp"
                        role="menuitem"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                        </svg>
                        <span>Falar com Futebot</span>
                      </a>

                      <Link
                        href="/"
                        className="flex items-center space-x-3 px-5 py-2.5 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Ir para Competições"
                        role="menuitem"
                      >
                        <Trophy className="h-4 w-4" aria-hidden="true" />
                        <span>Competições</span>
                      </Link>

                      <Link
                        href="/times"
                        className="flex items-center space-x-3 px-5 py-2.5 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Ir para Times"
                        role="menuitem"
                      >
                        <Shield className="h-4 w-4" aria-hidden="true" />
                        <span>Times</span>
                      </Link>

                      <Link
                        href="/estadios"
                        className="flex items-center space-x-3 px-5 py-2.5 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Ir para Estádios"
                        role="menuitem"
                      >
                        <Building className="h-4 w-4" aria-hidden="true" />
                        <span>Estádios</span>
                      </Link>

                      <Link
                        href="/jogadores"
                        className="flex items-center space-x-3 px-5 py-2.5 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Ir para Jogadores"
                        role="menuitem"
                      >
                        <Users className="h-4 w-4" aria-hidden="true" />
                        <span>Jogadores</span>
                      </Link>
                      
                      {currentCompetition && (
                        <>
                          <div className="border-t border-gray-200 my-2" role="separator"></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase px-5 py-1.5">Nesta Competição</span>
                          <Link
                            href={`/${currentCompetition.slug}/classificacao`}
                            className="flex items-center space-x-3 px-5 py-2.5 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                            aria-label="Ver Tabela de Classificação da Competição"
                            role="menuitem"
                          >
                            <ListOrdered className="h-4 w-4" aria-hidden="true" />
                            <span>Tabela</span>
                          </Link>
                          
                          <Link
                            href={`/${currentCompetition.slug}/jogos`}
                            className="flex items-center space-x-3 px-5 py-2.5 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                            aria-label="Ver Jogos da Competição"
                            role="menuitem"
                          >
                            <Search className="h-4 w-4" aria-hidden="true" />
                            <span>Jogos</span>
                          </Link>
                          
                          <Link
                            href={`/${currentCompetition.slug}/artilharia`}
                            className="flex items-center space-x-3 px-5 py-2.5 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                            aria-label="Ver Artilharia da Competição"
                            role="menuitem"
                          >
                            <Star className="h-4 w-4" aria-hidden="true" />
                            <span>Artilharia</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </nav>
                )}
              </div>
              <Link href="/" className="flex items-center space-x-3" aria-label="Ir para página inicial">
                <img 
                  src={getFutepediaLogoUrl(futepediaLogoUrl)}
                  alt="Kmiza27 Logo" 
                  className="max-h-5"
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {currentCompetition ? currentCompetition.name : 'Futepédia'}
                  </h1>
                </div>
              </Link>
            </div>
            
            {/* Search Section */}
            <div className="flex justify-end md:flex-none items-center md:ml-8">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-label={isMobileSearchOpen ? "Fechar busca" : "Abrir busca"}
                aria-expanded={isMobileSearchOpen ? "true" : "false"}
              >
                {isMobileSearchOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
              </button>

               {/* Desktop Search */}
              <div className="hidden md:block relative w-full max-w-md md:flex-none md:ml-8" ref={searchContainerRef}>
                <SearchComponent 
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  loading={loading}
                />
                 {/* Search Results Dropdown for Desktop */}
                {results && (
                    <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto" aria-label="Resultados da busca">
                      {Object.entries(results).map(([type, items]) => {
                        if (items.length === 0) return null;
                        const typeMap: any = {
                          teams: { title: 'Times', icon: <Shield className="h-4 w-4 text-gray-500" aria-hidden="true" />, link: (item: any) => `/time/${item.id}` },
                          players: { title: 'Jogadores', icon: <User className="h-4 w-4 text-gray-500" aria-hidden="true" />, link: () => '/jogadores' },
                          stadiums: { title: 'Estádios', icon: <Building className="h-4 w-4 text-gray-500" aria-hidden="true" />, link: (item: any) => `/estadio/${item.id}` },
                          competitions: { title: 'Competições', icon: <Trophy className="h-4 w-4 text-gray-500" aria-hidden="true" />, link: (item: any) => `/${item.slug}/jogos` },
                        };
                        return (
                          <div key={type}>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase px-4 pt-3 pb-1">{typeMap[type].title}</h3>
                            <ul aria-label={`Resultados de ${typeMap[type].title}`}>
                              {items.map((item: any) => (
                                <li key={`${type}-${item.id}`}>
                                  <Link href={typeMap[type].link(item)} onClick={clearSearch} className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100">
                                    {typeMap[type].icon}
                                    <span className="text-sm text-gray-800">{item.name}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                       {(results.teams.length + results.players.length + results.stadiums.length + results.competitions.length) === 0 && !loading &&
                          <div className="p-4 text-center text-sm text-gray-500">Nenhum resultado encontrado.</div>
                       }
                    </div>
                )}
              </div>

              {/* Mobile Search Icon */}
              <div className="md:hidden">
                <button onClick={() => setIsMobileSearchOpen(true)} className="p-2 text-gray-600" aria-label="Abrir busca">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>


      </header>

      {/* Mobile Search Overlay (agora fora do header e com position:fixed) */}
      {isMobileSearchOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col" role="dialog" aria-label="Busca móvel">
          <div className="flex items-center h-16 border-b border-gray-200 px-2">
            <div className="flex-1">
              <SearchComponent
                ref={searchInputRef}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                loading={loading}
              />
            </div>
            <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 ml-2 text-gray-600" aria-label="Fechar busca">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {results && (
            <div className="flex-1 overflow-y-auto bg-white" aria-label="Resultados da busca">
               {Object.entries(results).map(([type, items]) => {
                if (items.length === 0) return null;
                const typeMap: any = {
                  teams: { title: 'Times', icon: <Shield className="h-4 w-4 text-gray-500" aria-hidden="true" />, link: (item: any) => `/time/${item.id}` },
                  players: { title: 'Jogadores', icon: <User className="h-4 w-4 text-gray-500" aria-hidden="true" />, link: () => '/jogadores' },
                  stadiums: { title: 'Estádios', icon: <Building className="h-4 w-4 text-gray-500" aria-hidden="true" />, link: (item: any) => `/estadio/${item.id}` },
                  competitions: { title: 'Competições', icon: <Trophy className="h-4 w-4 text-gray-500" aria-hidden="true" />, link: (item: any) => `/${item.slug}/jogos` },
                };
                return (
                  <div key={type}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase px-4 pt-3 pb-1">{typeMap[type].title}</h3>
                    <ul aria-label={`Resultados de ${typeMap[type].title}`}>
                      {items.map((item: any) => (
                        <li key={`${type}-${item.id}`}>
                          <Link href={typeMap[type].link(item)} onClick={() => { clearSearch(); setIsMobileSearchOpen(false); }} className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100">
                            {typeMap[type].icon}
                            <span className="text-sm text-gray-800">{item.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
               {(results.teams.length + results.players.length + results.stadiums.length + results.competitions.length) === 0 && !loading &&
                  <div className="p-4 text-center text-sm text-gray-500">Nenhum resultado encontrado.</div>
               }
            </div>
          )}
        </div>
      )}
    </>
  );
} 