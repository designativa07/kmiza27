'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameTeam } from '@/lib/supabase';

export default function TeamCreator() {
  const { createTeam, loadTeams, isLoading, error } = useGameStore();
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [teamData, setTeamData] = useState({
    name: '',
    short_name: '',
    stadium_name: '',
    stadium_capacity: 1000, // Valor padrão
    colors: {
      primary: '#ff0000',
      secondary: '#ffffff'
    }
  });



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    
    try {
      await createTeam(teamData);
      setSuccess(true);
      
      // Recarregar a lista de times
      await loadTeams();
      
      // Limpar formulário após sucesso
      setTeamData({
        name: '',
        short_name: '',
        stadium_name: '',
        stadium_capacity: 1000, // Valor padrão
        colors: {
          primary: '#ff0000',
          secondary: '#ffffff'
        }
      });
      
      // Esconder formulário após sucesso
      setShowForm(false);
      
      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error in form submission:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTeamData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setTeamData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (!showForm) {

    return (
      <div className="card">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Bem-vindo ao Kmiza27 Game!
          </h2>
          <p className="text-gray-700 mb-6">
            Crie seu primeiro time para começar sua jornada no futebol!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-base"
          >
            🏆 Criar Meu Primeiro Time
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          🏆 Criar Time
        </h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ✕
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ Time criado com sucesso! Você pode ver seu time na lista.
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Time *
          </label>
          <input
            type="text"
            value={teamData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
            placeholder="Digite o nome do time"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Curto
          </label>
          <input
            type="text"
            value={teamData.short_name}
            onChange={(e) => handleInputChange('short_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            placeholder="Ex: AVA"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Estádio
          </label>
          <input
            type="text"
            value={teamData.stadium_name}
            onChange={(e) => handleInputChange('stadium_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            placeholder="Digite o nome do estádio"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700 mb-1">
              Cor Principal
            </label>
            <input
              id="primary-color"
              type="color"
              value={teamData.colors.primary}
              onChange={(e) => handleInputChange('colors.primary', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              aria-label="Selecionar cor principal do time"
            />
          </div>
          
          <div>
            <label htmlFor="secondary-color" className="block text-sm font-medium text-gray-700 mb-1">
              Cor Secundária
            </label>
            <input
              id="secondary-color"
              type="color"
              value={teamData.colors.secondary}
              onChange={(e) => handleInputChange('colors.secondary', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              aria-label="Selecionar cor secundária do time"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Criando...' : 'Criar Time'}
        </button>
      </form>
    </div>
  );
} 