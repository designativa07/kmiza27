'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function UserProfile() {
  const { logout } = useGameStore();
  const [userData, setUserData] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('gameUser');
    if (savedUser) {
      setUserData(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfile(false);
  };

  if (!userData) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowProfile(!showProfile)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        👤 {userData.displayName || userData.username}
      </button>

      {showProfile && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Perfil do Usuário</h3>
            
            <div className="space-y-2 text-sm mb-4">
              <div>
                <span className="text-gray-500">Nome:</span>
                <span className="ml-2 font-medium">{userData.displayName || 'Não definido'}</span>
              </div>
              <div>
                <span className="text-gray-500">Usuário:</span>
                <span className="ml-2 font-medium">{userData.username || 'Não definido'}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{userData.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Membro desde:</span>
                <span className="ml-2 font-medium">
                  {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                </span>
              </div>
            </div>

            <div className="border-t pt-3">
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 