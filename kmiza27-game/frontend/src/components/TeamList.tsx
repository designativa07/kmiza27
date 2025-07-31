'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { GameTeam } from '@/lib/supabase';
import StadiumExpansion from './StadiumExpansion';

export default function TeamList() {
  const router = useRouter();
  const { userTeams, selectedTeam, loadTeams, setSelectedTeam, deleteTeam, isLoading, error } = useGameStore();
  const [deletingTeams, setDeletingTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleSelectTeam = (team: GameTeam) => {
    if (team && team.id) {
      setSelectedTeam(team);
      router.push(`/team/${team.id}`);
    }
  };

  const handleDeleteTeam = async (team: GameTeam) => {
    if (!team || !team.id) return;
    
    if (confirm(`Tem certeza que deseja deletar o time "${team.name}"? Esta ação não pode ser desfeita.`)) {
      try {
        setDeletingTeams(prev => new Set(prev).add(team.id));
        await deleteTeam(team.id);
        alert('Time deletado com sucesso!');
      } catch (error) {
        alert(`Erro ao deletar time: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      } finally {
        setDeletingTeams(prev => {
          const newSet = new Set(prev);
          newSet.delete(team.id);
          return newSet;
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando times...</p>
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

  const validTeams = userTeams.filter(team => team && team.id);

  if (validTeams.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Meus Times</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚽</div>
          <p className="text-gray-600">Nenhum time criado ainda</p>
          <p className="text-sm text-gray-500 mt-2">Crie seu primeiro time para começar!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Meus Times</h2>
      
      <div className="space-y-3 mb-6">
        {validTeams.map((team) => (
          <div
            key={team?.id || `team-${Math.random()}`}
            className={`p-3 border rounded-lg transition-all duration-200 ${
              selectedTeam?.id === team?.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer"
                style={{
                  backgroundColor: team?.colors?.primary || '#3b82f6',
                  color: team?.colors?.secondary || '#ffffff'
                }}
                onClick={() => handleSelectTeam(team)}
              >
                {team?.short_name || (team?.name ? team.name.charAt(0).toUpperCase() : '?')}
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => handleSelectTeam(team)}>
                <h3 className="font-semibold text-gray-900">{team?.name}</h3>
                <p className="text-sm text-gray-600">{team?.stadium_name || 'Sem estádio'}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600">
                  R$ {(team?.budget || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {(team?.stadium_capacity || 0).toLocaleString()} lugares
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTeam(team);
                }}
                disabled={deletingTeams.has(team?.id || '')}
                className={`ml-2 p-1 rounded transition-colors ${
                  deletingTeams.has(team?.id || '')
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                }`}
                title={deletingTeams.has(team?.id || '') ? 'Deletando...' : 'Deletar time'}
              >
                {deletingTeams.has(team?.id || '') ? '⏳' : '🗑️'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedTeam && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            {selectedTeam.name} - Expansão de Estádio
          </h3>
          <StadiumExpansion team={selectedTeam} />
        </div>
      )}
    </div>
  );
} 