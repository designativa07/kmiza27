'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Menu, X, Home, Trophy, MapPin, Users, Shield, Building, User, MessageCircle, ListOrdered, Star } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { getApiUrl } from '@/lib/config';
import React from 'react';

interface HeaderProps {
  currentCompetition?: {
    name: string;
    slug: string;
  };
  showBackToHome?: boolean;
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
      <Search className="h-5 w-5 text-gray-400" />
    </div>
    <input
      ref={ref}
      type="text"
      placeholder="Buscar..."
      className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
      value={value}
      onChange={onChange}
    />
    {loading && <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div></div>}
  </div>
));
SearchComponent.displayName = 'SearchComponent';

export function Header({ currentCompetition, showBackToHome = true }: HeaderProps) {
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
          <div className="flex items-center justify-between h-16">
            
            {/* Left section */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Link href="/" className="flex items-center space-x-3">
                <img 
                  src="https://cdn.kmiza27.com/img/escudos/kmiza27_logo30px.gif" 
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
            <div className="flex-1 flex justify-end items-center">
               {/* Desktop Search */}
              <div className="hidden md:block relative w-full max-w-xs" ref={searchContainerRef}>
                <SearchComponent 
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  loading={loading}
                />
                 {/* Search Results Dropdown for Desktop */}
                {results && (
                    <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      {Object.entries(results).map(([type, items]) => {
                        if (items.length === 0) return null;
                        const typeMap: any = {
                          teams: { title: 'Times', icon: <Shield className="h-4 w-4 text-gray-500" />, link: (item: any) => `/time/${item.id}` },
                          players: { title: 'Jogadores', icon: <User className="h-4 w-4 text-gray-500" />, link: () => '/jogadores' },
                          stadiums: { title: 'Estádios', icon: <Building className="h-4 w-4 text-gray-500" />, link: (item: any) => `/estadio/${item.id}` },
                          competitions: { title: 'Competições', icon: <Trophy className="h-4 w-4 text-gray-500" />, link: (item: any) => `/${item.slug}/classificacao` },
                        };
                        return (
                          <div key={type}>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase px-4 pt-3 pb-1">{typeMap[type].title}</h3>
                            <ul>
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
                <button onClick={() => setIsMobileSearchOpen(true)} className="p-2 text-gray-600">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Menu mobile expandido (ainda posicionado em relação ao header) */}
        {isMenuOpen && (
            <div className="absolute top-full left-2 sm:left-6 lg:left-8 bg-white border border-gray-200 rounded-b-lg shadow-lg z-40 py-2 space-y-2 min-w-80">
              {/* Links de navegação */}
              <div className="space-y-1 px-3">
                <a
                  href="https://wa.me/554896265397"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Fale com o Chatbot</span>
                </a>

                <Link
                  href="/"
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Trophy className="h-4 w-4" />
                  <span>Competições</span>
                </Link>

                <Link
                  href="/times"
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  <span>Times</span>
                </Link>

                <Link
                  href="/estadios"
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Building className="h-4 w-4" />
                  <span>Estádios</span>
                </Link>

                <Link
                  href="/jogadores"
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  <span>Jogadores</span>
                </Link>
                
                {currentCompetition && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    <span className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">Nesta Competição</span>
                    <Link
                      href={`/${currentCompetition.slug}/classificacao`}
                      className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ListOrdered className="h-4 w-4" />
                      <span>Tabela</span>
                    </Link>
                    
                    <Link
                      href={`/${currentCompetition.slug}/jogos`}
                      className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Search className="h-4 w-4" />
                      <span>Jogos</span>
                    </Link>
                    
                    <Link
                      href={`/${currentCompetition.slug}/artilharia`}
                      className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Star className="h-4 w-4" />
                      <span>Artilharia</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
      </header>

      {/* Mobile Search Overlay (agora fora do header e com position:fixed) */}
      {isMobileSearchOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center h-16 border-b border-gray-200 px-2">
            <div className="flex-1">
              <SearchComponent
                ref={searchInputRef}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                loading={loading}
              />
            </div>
            <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 ml-2 text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          {results && (
            <div className="flex-1 overflow-y-auto bg-white">
               {Object.entries(results).map(([type, items]) => {
                if (items.length === 0) return null;
                const typeMap: any = {
                  teams: { title: 'Times', icon: <Shield className="h-4 w-4 text-gray-500" />, link: (item: any) => `/time/${item.id}` },
                  players: { title: 'Jogadores', icon: <User className="h-4 w-4 text-gray-500" />, link: () => '/jogadores' },
                  stadiums: { title: 'Estádios', icon: <Building className="h-4 w-4 text-gray-500" />, link: (item: any) => `/estadio/${item.id}` },
                  competitions: { title: 'Competições', icon: <Trophy className="h-4 w-4 text-gray-500" />, link: (item: any) => `/${item.slug}/classificacao` },
                };
                return (
                  <div key={type}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase px-4 pt-3 pb-1">{typeMap[type].title}</h3>
                    <ul>
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