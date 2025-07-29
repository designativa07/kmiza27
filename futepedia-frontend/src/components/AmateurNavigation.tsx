'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Trophy, 
  Shield, 
  Users, 
  Calendar, 
  Settings, 
  Home,
  BarChart3,
  MapPin
} from 'lucide-react';

interface AmateurNavigationProps {
  user?: any;
  stats?: {
    competitions: number;
    teams: number;
    players: number;
    matches: number;
  };
}

export default function AmateurNavigation({ user, stats }: AmateurNavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin-amadores',
      icon: Home,
      description: 'Visão geral do painel'
    },
    {
      name: 'Competições',
      href: '/admin-amadores/competicoes',
      icon: Trophy,
      description: 'Gerencie suas competições',
      count: stats?.competitions
    },
    {
      name: 'Times',
      href: '/admin-amadores/times',
      icon: Shield,
      description: 'Administre seus times',
      count: stats?.teams
    },
    {
      name: 'Jogadores',
      href: '/admin-amadores/jogadores',
      icon: Users,
      description: 'Gerencie jogadores',
      count: stats?.players
    },
    {
      name: 'Jogos',
      href: '/admin-amadores/jogos',
      icon: Calendar,
      description: 'Administre partidas',
      count: stats?.matches
    },
    {
      name: 'Estádios',
      href: '/admin-amadores/estadios',
      icon: MapPin,
      description: 'Gerencie locais de jogo'
    },
    {
      name: 'Estatísticas',
      href: '/admin-amadores/estatisticas',
      icon: BarChart3,
      description: 'Visualize estatísticas'
    },
    {
      name: 'Minha Conta',
      href: '/admin-amadores/conta',
      icon: Settings,
      description: 'Configurações do perfil'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/admin-amadores') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <div className="flex items-center justify-between h-16 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Logado como</span>
            <span className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{item.name}</span>
                    {item.count !== undefined && (
                      <span className="bg-gray-200 text-gray-700 text-xs px-1 py-0.5 rounded-full ml-1">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-xs text-gray-500">Logado como</span>
              <span className="text-xs font-medium text-gray-900">{user?.name || 'Usuário'}</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      active
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    {item.count !== undefined && (
                      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full ml-auto">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 