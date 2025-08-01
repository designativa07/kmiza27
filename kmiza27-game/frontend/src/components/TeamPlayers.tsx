'use client';
import { useState, useEffect } from 'react';
import { gameApi } from '@/services/gameApi';

interface Player {
  id: string;
  name: string;
  position: string;
  date_of_birth: string;
  nationality: string;
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  potential: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  status: string;
  contract_date: string;
  created_at: string;
}

interface TeamPlayersProps {
  teamId: string;
  teamName: string;
}

export default function TeamPlayers({ teamId, teamName }: TeamPlayersProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
  }, [teamId]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Carregando jogadores para o time:', teamId);
      const playersData = await gameApi.getTeamPlayers(teamId);
      console.log('📊 Dados recebidos:', playersData);
      console.log('📊 Tipo dos dados:', typeof playersData);
      console.log('📊 É array?', Array.isArray(playersData));
      
      const finalPlayers = Array.isArray(playersData) ? playersData : [];
      console.log('📊 Jogadores finais:', finalPlayers);
      setPlayers(finalPlayers);
    } catch (err) {
      setError('Erro ao carregar jogadores');
      console.error('Error loading players:', err);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'Goleiro':
        return 'bg-red-100 text-red-800';
      case 'Zagueiro':
        return 'bg-blue-100 text-blue-800';
      case 'Lateral Esquerdo':
      case 'Lateral Direito':
        return 'bg-green-100 text-green-800';
      case 'Volante':
        return 'bg-yellow-100 text-yellow-800';
      case 'Meia Central':
      case 'Meia Ofensivo':
        return 'bg-purple-100 text-purple-800';
      case 'Ponta Esquerda':
      case 'Ponta Direita':
        return 'bg-orange-100 text-orange-800';
      case 'Atacante':
      case 'Centroavante':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOverall = (attributes: any) => {
    return Math.round(
      (attributes.pace + attributes.shooting + attributes.passing + 
       attributes.dribbling + attributes.defending + attributes.physical) / 6
    );
  };

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">👥 Jogadores do {teamName}</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">👥 Jogadores do {teamName}</h3>
        <div className="text-red-600 text-center py-4">{error}</div>
      </div>
    );
  }

  // Verificação adicional de segurança
  if (!Array.isArray(players)) {
    console.error('❌ Players não é um array:', players);
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">👥 Jogadores do {teamName}</h3>
        <div className="text-red-600 text-center py-4">Erro: Dados inválidos recebidos do servidor</div>
      </div>
    );
  }

  const positions = (players || []).reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">👥 Jogadores do {teamName}</h3>
      
      {/* Estatísticas */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">📊 Distribuição por Posição</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(positions).map(([position, count]) => (
            <div key={position} className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <span className="text-sm">{position}</span>
              <span className="font-semibold text-blue-600">{count}</span>
            </div>
          ))}
        </div>
      </div>

             {/* Lista de Jogadores */}
       <div className="space-y-3">
         {(players || []).map((player) => (
          <div key={player.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-lg">{player.name}</h4>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                  {player.position}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {calculateOverall(player.attributes)}
                </div>
                <div className="text-xs text-gray-500">Overall</div>
              </div>
            </div>
            
            {/* Atributos */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <div className="text-xs text-gray-500">Velocidade</div>
                <div className="font-semibold">{player.attributes.pace}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Finalização</div>
                <div className="font-semibold">{player.attributes.shooting}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Passe</div>
                <div className="font-semibold">{player.attributes.passing}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Drible</div>
                <div className="font-semibold">{player.attributes.dribbling}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Defesa</div>
                <div className="font-semibold">{player.attributes.defending}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Físico</div>
                <div className="font-semibold">{player.attributes.physical}</div>
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="mt-3 text-xs text-gray-500">
              <div>Idade: {new Date().getFullYear() - new Date(player.date_of_birth).getFullYear()} anos</div>
              <div>Nacionalidade: {player.nationality}</div>
              <div>Status: {player.status}</div>
            </div>
          </div>
        ))}
      </div>

      {players.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum jogador encontrado para este time.
        </div>
      )}
    </div>
  );
} 