'use client';
import { useState, useEffect } from 'react';
import { gameApiReformed } from '@/services/gameApiReformed';
import PlayerGrid from './players/PlayerGrid';

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
  overall?: number;
  age?: number;
  salary?: number;
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
      const response = await gameApiReformed.getPlayers(teamId);
      const normalized: Player[] = (response || []).map((p: any) => {
        // Detectar formatos possíveis e normalizar
        const hasNested = !!p.attributes;
        const attrs = hasNested
          ? p.attributes
          : {
              pace: Math.round(((p.speed ?? 0) + (p.stamina ?? 0)) / 2),
              shooting: Math.round(((p.shooting ?? 0) + (p.finishing ?? 0)) / 2),
              passing: p.passing ?? 0,
              dribbling: p.dribbling ?? 0,
              defending: Math.round(((p.defending ?? 0) + (p.tackling ?? 0)) / 2),
              physical: Math.round(((p.strength ?? 0) + (p.stamina ?? 0) + (p.jumping ?? 0)) / 3),
            };

        const overall = Math.round(
          (attrs.pace + attrs.shooting + attrs.passing + attrs.dribbling + attrs.defending + attrs.physical) / 6,
        );

        const salary = p.salary_monthly ?? p.salary ?? 0;
        const dob = p.date_of_birth || '2000-01-01';
        const age = p.age ?? Math.max(16, new Date().getFullYear() - new Date(dob).getFullYear());

        return {
          id: p.id,
          name: p.name,
          position: p.position || p.role || 'CM',
          date_of_birth: dob,
          nationality: p.nationality || 'BRA',
          attributes: attrs,
          potential: p.potential
            ? {
                pace: attrs.pace + 5,
                shooting: attrs.shooting + 5,
                passing: attrs.passing + 5,
                dribbling: attrs.dribbling + 5,
                defending: attrs.defending + 5,
                physical: attrs.physical + 5,
              }
            : { ...attrs },
          status: 'Ativo',
          contract_date: p.contract_end_date || p.contract_date || '',
          created_at: p.created_at || new Date().toISOString(),
          overall,
          age,
          salary,
        } as Player;
      });
      setPlayers(normalized);
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
        attributes.dribbling + attributes.defending + attributes.physical) / 6,
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
      <PlayerGrid players={(players as any)} />
      {players.length === 0 && (<div className="text-center py-8 text-gray-500">Nenhum jogador encontrado para este time.</div>)}
    </div>
  );
} 