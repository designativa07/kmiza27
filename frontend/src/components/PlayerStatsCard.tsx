import React from 'react';
import { format, parseISO } from 'date-fns';
import { getPlayerImageUrl, getTeamLogoUrl, handleImageError } from '../lib/cdn';

interface Team {
  id: number;
  name: string;
  short_name?: string;
  logo_url?: string;
}

interface PlayerTeamHistory {
  id: number;
  player_id: number;
  team_id: number;
  start_date: string;
  end_date?: string;
  jersey_number?: string;
  role?: string;
  team: Team;
}

interface Goal {
  id: number;
  player_id: number;
  match_id: number;
  team_id: number;
  minute: number;
  type: string;
  created_at: string;
  updated_at: string;
}

interface Card {
  id: number;
  player_id: number;
  match_id: number;
  type: 'yellow' | 'red';
  minute: number;
  reason?: string;
  created_at: string;
  updated_at: string;
}

interface Player {
  id: number;
  name: string;
  position?: string;
  date_of_birth?: string;
  nationality?: string;
  image_url?: string;
  team_history?: PlayerTeamHistory[];
  goals?: Goal[];
  cards?: Card[];
}

interface PlayerStatsCardProps {
  player: Player | null;
  onClose: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  // A data pode vir em formato ISO do backend, então parseISO é útil.
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy');
  } catch (error) {
    console.error('Erro ao formatar data:', dateString, error);
    return dateString; // Retorna a string original se houver erro
  }
};

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ player, onClose }) => {
  if (!player) {
    return null;
  }

  const totalGoals = player.goals?.length || 0;
  const yellowCards = player.cards?.filter(card => card.type === 'yellow').length || 0;
  const redCards = player.cards?.filter(card => card.type === 'red').length || 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-auto my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Estatísticas do Jogador</h2>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-shrink-0">
            <img
              src={player.image_url ? getPlayerImageUrl(player.image_url) : '/placeholder-player.png'}
              alt={player.name}
              className="h-20 w-20 rounded-full object-cover"
              onError={handleImageError}
            />
          </div>

          <div className="flex-grow text-center md:text-left">
            <h3 className="text-xl font-semibold text-gray-800">{player.name}</h3>
            <p className="text-gray-600">Posição: {player.position || 'N/A'}</p>
            <p className="text-gray-600">Nacionalidade: {player.nationality || 'N/A'}</p>
            <p className="text-gray-600">Nascimento: {formatDate(player.date_of_birth)}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estatísticas Gerais */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Resumo de Estatísticas</h4>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700">Gols Marcados: <span className="font-bold">{totalGoals}</span></p>
              <p className="text-gray-700">Cartões Amarelos: <span className="font-bold">{yellowCards}</span></p>
              <p className="text-gray-700">Cartões Vermelhos: <span className="font-bold">{redCards}</span></p>
            </div>
          </div>

          {/* Histórico de Times */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Histórico de Times</h4>
            {player.team_history && player.team_history.length > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {player.team_history
                  .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                  .map((history) => (
                    <li key={history.id} className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
                      <img
                        src={getTeamLogoUrl(history.team.logo_url)}
                        alt={`${history.team.name} logo`}
                        className="h-6 w-6 object-contain"
                        onError={handleImageError}
                      />
                      {!history.team.logo_url && (
                        <div className="h-6 w-6 flex items-center justify-center bg-gray-200 rounded text-xs font-semibold text-gray-600">
                          {history.team.short_name?.substring(0, 3) || ''}
                        </div>
                      )}
                      <p className="text-sm text-gray-700 flex-grow">
                        <span className="font-medium">{history.team.name}</span> ({history.jersey_number || 'N/A'})
                        <br />
                        <span className="text-xs text-gray-500">
                          {formatDate(history.start_date)} - {history.end_date ? formatDate(history.end_date) : 'Presente'}
                          {history.role && ` (${history.role})`}
                        </span>
                      </p>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-600">Nenhum histórico de time encontrado.</p>
            )}
          </div>
        </div>

        {/* Seções Adicionais (Gols, Cartões Detalhados) */}
        {(player.goals && player.goals.length > 0) && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Gols Marcados</h4>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {player.goals
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(goal => (
                  <li key={goal.id} className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                    <span className="font-bold text-green-700">GOL!</span>
                    <p className="text-sm text-gray-700">
                      Minuto {goal.minute} ({goal.type === 'normal' ? 'Normal' : goal.type})
                    </p>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {(player.cards && player.cards.length > 0) && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Cartões Recebidos</h4>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {player.cards
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(card => (
                  <li key={card.id} className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                    <span className={`font-bold ${card.type === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {card.type === 'yellow' ? 'AMARELO' : 'VERMELHO'}
                    </span>
                    <p className="text-sm text-gray-700">
                      Minuto {card.minute} {card.reason && `(${card.reason})`}
                    </p>
                  </li>
                ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default PlayerStatsCard; 