'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon, 
  UsersIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  SignalIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Estatísticas', href: '/stats', icon: ChartBarIcon },
  { name: 'Usuários', href: '/users', icon: UsersIcon },
  { name: 'Administradores', href: '/admins', icon: UserGroupIcon },
  { name: 'Competições', href: '/competitions', icon: TrophyIcon },
  { name: 'Times', href: '/teams', icon: ShieldCheckIcon },
  { name: 'Partidas', href: '/matches', icon: CalendarDaysIcon },
  { name: 'Canais', href: '/channels', icon: SignalIcon },
  { name: 'Notificações', href: '/notifications', icon: BellIcon },
  { name: 'Estádios', href: '/stadiums', icon: BuildingOfficeIcon },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Kmiza27 Admin</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <nav className="mt-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 shadow-lg">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-900">Kmiza27 Admin</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <item.icon className="h-6 w-6 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
            </div>
            <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
              {/* User menu */}
              <div className="flex items-center gap-x-4">
                <div className="hidden lg:flex lg:items-center lg:gap-x-2">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-gray-900">
                      {user?.name || user?.username}
                    </p>
                    <p className="text-xs leading-5 text-gray-500">
                      {user?.is_admin ? 'Administrador' : 'Usuário'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-x-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-x-2 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                    title="Sair"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span className="hidden sm:block">Sair</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 