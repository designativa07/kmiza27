'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { GameTeam } from '@/lib/supabase';

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
      <div className="card">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-700">Carregando times...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      </div>
    );
  }

  const validTeams = userTeams.filter(team => team && team.id);

  if (validTeams.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Meus Times</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚽</div>
          <p className="text-gray-700">Nenhum time criado ainda</p>
          <p className="text-sm text-gray-600 mt-2">Crie seu primeiro time para começar!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Meus Times</h2>
      
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
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{
                  backgroundColor: team?.colors?.primary || '#3b82f6',
                  color: team?.colors?.secondary || '#ffffff'
                }}
              >
                {team?.short_name || (team?.name ? team.name.charAt(0).toUpperCase() : '?')}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{team?.name}</h3>
                <p className="text-sm text-gray-700">{team?.stadium_name || 'Sem estádio'}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600">
                  R$ {(team?.budget || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">
                  {(team?.stadium_capacity || 0).toLocaleString()} lugares
                </div>
              </div>
              
              {/* Botões de ação */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTeam(team);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                  title="Gerenciar time"
                >
                  GERENCIAR
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTeam(team);
                  }}
                  disabled={deletingTeams.has(team?.id || '')}
                  className={`p-1 rounded transition-colors ${
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
          </div>
        ))}
      </div>

      
    </div>
  );
} 