'use client';

import { useEffect, useState } from 'react';
import TeamCreator from '@/components/TeamCreator';
import TeamList from '@/components/TeamList';
import MainTeamView from '@/components/MainTeamView';
import LoginForm from '@/components/LoginForm';
import UserProfile from '@/components/UserProfile';
import { useGameStore } from '@/store/gameStore';

export default function Home() {
  const { isAuthenticated, userId, setUserId, setIsAuthenticated } = useGameStore();
  const [userDisplayName, setUserDisplayName] = useState('');

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('gameUser');
    console.log('Home: savedUser =', savedUser);
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      console.log('Home: userData =', userData);
      setUserId(userData.id);
      setIsAuthenticated(true);
      setUserDisplayName(userData.displayName || userData.username || 'Usuário');
    }
  }, [setUserId, setIsAuthenticated]);

  console.log('Home: isAuthenticated =', isAuthenticated, 'userId =', userId);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🎮 Kmiza27 Game
            </h1>
            <p className="text-xl text-white/90">
              Jogo de Administração de Futebol
            </p>
          </header>
          
          <main className="max-w-md mx-auto">
            <LoginForm />
          </main>
          
          <footer className="text-center mt-12 text-white/70">
            <p>© 2025 Kmiza27 Game - Desenvolvido com ❤️</p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-4xl font-bold text-white">
              🎮 Kmiza27 Game
            </h1>
            <UserProfile />
          </div>
          <p className="text-xl text-white/90">
            Jogo de Administração de Futebol
          </p>
          <p className="text-sm text-white/70 mt-2">
            Bem-vindo, {userDisplayName}!
          </p>
        </header>
        
        <main className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Seção Principal - Time ou Criação */}
            <div className="bg-red-100 p-4">
              <h3 className="text-red-800 font-bold">DEBUG: TeamCreator</h3>
              <TeamCreator />
            </div>
            
            {/* Seção de Lista de Times (se houver mais de um) */}
            <div className="bg-blue-100 p-4">
              <h3 className="text-blue-800 font-bold">DEBUG: TeamList</h3>
              <TeamList />
            </div>
            
            {/* Seção de Apresentação do Jogo */}
            <div className="bg-green-100 p-4">
              <h3 className="text-green-800 font-bold">DEBUG: Info</h3>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  🎮 Sobre o Jogo
                </h2>
                
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">🏆 Funcionalidades Principais</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Criação de times personalizados</li>
                      <li>• Sistema de academia de base</li>
                      <li>• Peneiras para descobrir talentos</li>
                      <li>• Gestão de orçamento</li>
                      <li>• Simulação de partidas</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">🚀 Próximas Atualizações</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Simulação visual avançada</li>
                      <li>• Sistema de transferências</li>
                      <li>• Competições entre times</li>
                      <li>• Integração WhatsApp</li>
                      <li>• Expansão de estádios</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">💡 Como Jogar</h3>
                    <p className="text-sm text-blue-700">
                      1. Crie seu primeiro time com nome, cores e estádio
                      2. Gerencie seu orçamento e invista em melhorias
                      3. Desenvolva sua academia de base para descobrir talentos
                      4. Participe de competições e torneios
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">⚽ Características</h3>
                    <p className="text-sm text-green-700">
                      • Estádios começam com 1.000 lugares (expansível)
                      • Orçamento inicial para investimentos
                      • Academia de base básica incluída
                      • Sistema de cores personalizáveis
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <footer className="text-center mt-12 text-white/70">
          <p>© 2025 Kmiza27 Game - Desenvolvido com ❤️</p>
        </footer>
      </div>
    </div>
  );
}
