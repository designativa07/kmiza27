'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { GameTeam } from '@/lib/supabase';
import StadiumExpansion from '@/components/StadiumExpansion';
import TeamPlayers from '@/components/TeamPlayers';
import YouthAcademy from '@/components/YouthAcademy';
import FinanceManager from '@/components/FinanceManager';
import MatchSimulator from '@/components/MatchSimulator';

export default function TeamPageContent() {
  const params = useParams();
  const router = useRouter();
  const { userTeams, selectedTeam, loadTeams, setSelectedTeam, deleteTeam, isLoading, error } = useGameStore();
  const [team, setTeam] = useState<GameTeam | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleting, setIsDeleting] = useState(false);

  const teamId = params.teamId as string;

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (userTeams.length > 0) {
      const foundTeam = userTeams.find(t => t.id === teamId);
      if (foundTeam) {
        setTeam(foundTeam);
        setSelectedTeam(foundTeam);
      } else {
        // Se o time não for encontrado, redirecionar para a página inicial
        router.push('/');
      }
    }
  }, [userTeams, teamId, setSelectedTeam, router]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 text-lg">Carregando seu time...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-gray-700 text-lg">Time não encontrado</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              {team.name}
            </h1>
            <button 
              onClick={async () => {
                if (confirm(`Tem certeza que deseja deletar o time "${team.name}"? Esta ação não pode ser desfeita.`)) {
                  try {
                    setIsDeleting(true);
                    await deleteTeam(team.id);
                    alert('Time deletado com sucesso!');
                    router.push('/');
                  } catch (error) {
                    alert(`Erro ao deletar time: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                  } finally {
                    setIsDeleting(false);
                  }
                }
              }}
              disabled={isDeleting}
              className={`transition-colors ${
                isDeleting 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-red-400 hover:text-red-300'
              }`}
              title={isDeleting ? 'Deletando...' : 'Deletar time'}
            >
              {isDeleting ? '⏳' : '🗑️'}
            </button>
          </div>
          
          {/* Card Principal do Time */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                style={{
                  backgroundColor: team.colors?.primary || '#3b82f6',
                  color: team.colors?.secondary || '#ffffff'
                }}
              >
                {team.short_name || (team.name ? team.name.charAt(0).toUpperCase() : '?')}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
                <p className="text-gray-600">{team.stadium_name || 'Sem estádio'}</p>
                <p className="text-sm text-gray-500">Criado em {new Date(team.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">R$ {(team.budget || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Orçamento</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{(team.stadium_capacity || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Lugares</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{team.reputation || 0}</div>
                <div className="text-sm text-gray-600">Reputação</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{(team.fan_base || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Torcida</div>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Visão Geral', icon: '📊' },
                  { id: 'stadium', label: 'Estádio', icon: '🏟️' },
                  { id: 'academy', label: 'Academia', icon: '🏃' },
                  { id: 'players', label: 'Jogadores', icon: '⚽' },
                  { id: 'matches', label: 'Partidas', icon: '🎮' },
                  { id: 'finances', label: 'Finanças', icon: '💰' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Visão Geral</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Próximas Ações</h4>
                      <div className="space-y-2">
                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                          🏟️ Expandir Estádio
                        </button>
                        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                          🏃 Realizar Peneira
                        </button>
                        <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                          ⚽ Simular Partida
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Status do Time</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Academia de Base:</span>
                          <span className="font-semibold">Nível 1</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jogadores na Base:</span>
                          <span className="font-semibold">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Próxima Partida:</span>
                          <span className="font-semibold">Nenhuma agendada</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Última Atualização:</span>
                          <span className="font-semibold">Hoje</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stadium' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Gerenciamento do Estádio</h3>
                  <StadiumExpansion team={team} />
                </div>
              )}

              {activeTab === 'academy' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Academia de Base</h3>
                  <YouthAcademy />
                </div>
              )}

              {activeTab === 'players' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Jogadores</h3>
                  <TeamPlayers teamId={team.id} teamName={team.name} />
                </div>
              )}

              {activeTab === 'matches' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Partidas</h3>
                  <MatchSimulator />
                </div>
              )}

              {activeTab === 'finances' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Finanças</h3>
                  <FinanceManager />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 