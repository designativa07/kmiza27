'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { GameTeam } from '@/lib/supabase';
import StadiumExpansion from './StadiumExpansion';

export default function MainTeamView() {
  const router = useRouter();
  const { userTeams, selectedTeam, loadTeams, setSelectedTeam, isLoading, error } = useGameStore();

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    // Selecionar automaticamente o primeiro time se não houver nenhum selecionado
    if (userTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(userTeams[0]);
    }
  }, [userTeams, selectedTeam, setSelectedTeam]);

  const handleTeamClick = (team: GameTeam) => {
    router.push(`/team/${team.id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando seu time...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (userTeams.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⚽</div>
          <p className="text-gray-600 mb-4">Você ainda não tem times criados</p>
          <p className="text-sm text-gray-500">Crie seu primeiro time para começar!</p>
        </div>
      </div>
    );
  }

  if (!selectedTeam) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <p className="text-gray-600">Selecionando seu time...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        🏆 Meu Time Principal
      </h2>
      
      {/* Card do Time - Clicável */}
      <div 
        className="mb-6 p-4 border border-slate-200 rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-all duration-200 shadow-sm"
        onClick={() => handleTeamClick(selectedTeam)}
      >
        <div className="flex items-center space-x-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{
              backgroundColor: selectedTeam.colors?.primary || '#3b82f6',
              color: selectedTeam.colors?.secondary || '#ffffff'
            }}
          >
            {selectedTeam.short_name || (selectedTeam.name ? selectedTeam.name.charAt(0).toUpperCase() : '?')}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{selectedTeam.name}</h3>
            <p className="text-sm text-gray-600">{selectedTeam.stadium_name || 'Sem estádio'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Orçamento:</span>
            <div className="font-semibold text-green-600">R$ {(selectedTeam.budget || 0).toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-500">Estádio:</span>
            <div className="font-semibold">{(selectedTeam.stadium_capacity || 0).toLocaleString()} lugares</div>
          </div>
          <div>
            <span className="text-gray-500">Reputação:</span>
            <div className="font-semibold">{selectedTeam.reputation || 0}</div>
          </div>
          <div>
            <span className="text-gray-500">Torcida:</span>
            <div className="font-semibold">{(selectedTeam.fan_base || 0).toLocaleString()}</div>
          </div>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-sm text-blue-600 font-medium">Clique para gerenciar seu time →</p>
        </div>
      </div>
      
      {/* Ações Rápidas */}
      <div className="space-y-3 mb-6">
        <button 
          onClick={() => handleTeamClick(selectedTeam)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          🏟️ Gerenciar Estádio
        </button>
        <button 
          onClick={() => handleTeamClick(selectedTeam)}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
        >
          🏃 Academia de Base
        </button>
        <button 
          onClick={() => handleTeamClick(selectedTeam)}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
        >
          ⚽ Jogar
        </button>
      </div>
      
      {/* Expansão de Estádio */}
      <StadiumExpansion team={selectedTeam} />
    </div>
  );
} 