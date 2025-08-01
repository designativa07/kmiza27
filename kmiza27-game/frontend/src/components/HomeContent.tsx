'use client';

import { useEffect, useState } from 'react';
import TeamCreator from '@/components/TeamCreator';
import TeamList from '@/components/TeamList';
import LoginForm from '@/components/LoginForm';
import UserProfile from '@/components/UserProfile';
import { useGameStore } from '@/store/gameStore';

export default function HomeContent() {
  const { isAuthenticated, userId, setUserId, setIsAuthenticated } = useGameStore();
  const [userDisplayName, setUserDisplayName] = useState('');

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('gameUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUserId(userData.id);
      setIsAuthenticated(true);
      setUserDisplayName(userData.displayName || userData.username || 'Usuário');
    }
  }, [setUserId, setIsAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎮 Kmiza27 Game
            </h1>
            <p className="text-xl text-gray-600">
              Jogo de Administração de Futebol
            </p>
          </header>
          
          <main className="max-w-md mx-auto">
            <LoginForm />
          </main>
          
          <footer className="text-center mt-12 text-gray-500">
            <p>© 2025 Kmiza27 Game - Desenvolvido com ❤️</p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-4xl font-bold text-gray-900">
              🎮 Kmiza27 Game
            </h1>
            <UserProfile />
          </div>
          <p className="text-xl text-gray-600 text-center">
            Jogo de Administração de Futebol
          </p>
          <p className="text-sm text-gray-500 text-center mt-2">
            Bem-vindo, {userDisplayName}!
          </p>
        </header>
        
        <main>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seção Principal - Time ou Criação */}
            <div>
              <TeamCreator />
            </div>
            
            {/* Seção de Lista de Times */}
            <div>
              <TeamList />
            </div>
          </div>
        </main>
        
        <footer className="text-center mt-12 text-gray-500">
          <p>© 2025 Kmiza27 Game - Desenvolvido com ❤️</p>
        </footer>
      </div>
    </div>
  );
} 