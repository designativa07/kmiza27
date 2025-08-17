'use client';
import { useState, useEffect } from 'react';
import { gameApiReformed } from '@/services/gameApiReformed';
import PlayerCard from './PlayerCard';

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
  training_focus?: string;
  training_intensity?: 'baixa' | 'normal' | 'alta';
  morale?: number;
  fitness?: number;
  form?: number;
}

interface TeamPlayersProps {
  teamId: string;
  teamName: string;
  onPlayerChanges?: () => void;
}

export default function TeamPlayers({ teamId, teamName, onPlayerChanges }: TeamPlayersProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<string>('ALL');
  const [sort, setSort] = useState<'overall' | 'age' | 'salary'>('overall');

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
          training_focus: p.training_focus,
          training_intensity: p.training_intensity,
          morale: p.morale,
          fitness: p.fitness,
          form: p.form,
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

  // Handlers para as ações do PlayerCard
  const handleConfigureTraining = (playerId: string) => {
    // TODO: Implementar modal de configuração de treino
    console.log('Configurar treino para jogador:', playerId);
    alert('Funcionalidade de configuração de treino será implementada em breve!');
  };

  const handleViewDetails = (playerId: string) => {
    // TODO: Implementar modal de detalhes do jogador
    console.log('Ver detalhes do jogador:', playerId);
    alert('Funcionalidade de detalhes será implementada em breve!');
  };

  const handleListPlayer = (playerId: string) => {
    // TODO: Implementar modal para listar jogador no mercado
    console.log('Listar jogador no mercado:', playerId);
    alert('Funcionalidade de listagem no mercado será implementada em breve!');
  };

  const handleFirePlayer = (playerId: string) => {
    if (confirm('Tem certeza que deseja demitir este jogador? Esta ação não pode ser desfeita.')) {
      // TODO: Implementar API para demitir jogador
      console.log('Demitir jogador:', playerId);
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      alert('Jogador demitido com sucesso!');
      
      // Notificar o componente pai sobre mudanças nos jogadores
      if (onPlayerChanges) {
        onPlayerChanges();
      }
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

  // Função para filtrar e ordenar jogadores
  const getFilteredPlayers = () => {
    const q = query.trim().toLowerCase();
    let list = players.filter((p) =>
      (!q || p.name.toLowerCase().includes(q)) && (pos === 'ALL' || positionMapping[p.position] === pos),
    );
    list = list.sort((a, b) => {
      if (sort === 'age') return (a.age ?? 0) - (b.age ?? 0);
      if (sort === 'salary') return (b.salary ?? 0) - (a.salary ?? 0);
      return (b.overall ?? 0) - (a.overall ?? 0);
    });
    return list;
  };

  // Mapeamento de posições para o formato esperado pelo PlayerCard
  const positionMapping: Record<string, string> = {
    // Português para inglês
    'Goleiro': 'GK',
    'Zagueiro': 'CB',
    'Lateral Esquerdo': 'LB',
    'Lateral Direito': 'RB',
    'Volante': 'CDM',
    'Meia Central': 'CM',
    'Meia Ofensivo': 'CAM',
    'Ponta Esquerda': 'LW',
    'Ponta Direita': 'RW',
    'Atacante': 'ST',
    'Centroavante': 'CF',
    // Inglês para inglês (caso já esteja no formato correto)
    'GK': 'GK',
    'CB': 'CB',
    'LB': 'LB',
    'RB': 'RB',
    'CDM': 'CDM',
    'CM': 'CM',
    'CAM': 'CAM',
    'LW': 'LW',
    'RW': 'RW',
    'ST': 'ST',
    'CF': 'CF'
  };

  const posToPt: Record<string, string> = { GK: 'GOL', CB: 'ZAG', LB: 'LE', RB: 'LD', CDM: 'VOL', CM: 'MC', CAM: 'MO', LW: 'PE', RW: 'PD', CF: 'SA', ST: 'ATA' };
  const availablePositions = ['ALL', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST'];

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

  const filteredPlayers = getFilteredPlayers();

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">👥 Jogadores do {teamName}</h3>
      
      {/* Controles de filtro e ordenação */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Buscar jogador" 
          className="border rounded px-2 py-1 text-sm" 
        />
        <select 
          value={pos} 
          onChange={(e) => setPos(e.target.value)} 
          className="border rounded px-2 py-1 text-sm"
          title="Filtrar por posição"
        >
          {availablePositions.map((p) => (
            <option key={p} value={p}>{p === 'ALL' ? 'Todas' : (posToPt[p] || p)}</option>
          ))}
        </select>
        <select 
          value={sort} 
          onChange={(e) => setSort(e.target.value as any)} 
          className="border rounded px-2 py-1 text-sm"
          title="Ordenar jogadores"
        >
          <option value="overall">Ordenar por Overall</option>
          <option value="age">Ordenar por Idade</option>
          <option value="salary">Ordenar por Salário</option>
        </select>
        <div className="ml-auto text-sm text-gray-600">
          Folha: R$ {filteredPlayers.reduce((s, p) => s + (p.salary || 0), 0).toLocaleString()}/mês
        </div>
      </div>

      {/* Grid de jogadores com PlayerCard unificado - 2-3 por linha para melhor visualização */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPlayers.map((p) => (
          <PlayerCard 
            key={p.id} 
            player={{
              id: p.id,
              name: p.name,
              position: positionMapping[p.position] || 'CM',
              age: p.age || 0,
              overall: p.overall || 0,
              potential: Math.max(...Object.values(p.potential)),
              attributes: {
                pace: p.attributes.pace,
                shooting: p.attributes.shooting,
                passing: p.attributes.passing,
                dribbling: p.attributes.dribbling,
                defending: p.attributes.defending,
                physical: p.attributes.physical,
              },
              training_focus: p.training_focus,
              training_intensity: p.training_intensity,
              type: 'professional',
              morale: p.morale,
              fitness: p.fitness,
              form: p.form,
            }}
            context="roster"
            showTrainingStatus={true}
            showAttributes={true}
            showPhysicalStats={true}
            showTrainingHistory={false}
            onConfigureTraining={handleConfigureTraining}
            onViewDetails={handleViewDetails}
            onListPlayer={handleListPlayer}
            onFirePlayer={handleFirePlayer}
            className="h-full"
          />
        ))}
      </div>
      
      {filteredPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum jogador encontrado para este time.
        </div>
      )}

      {/* LEGENDA DAS ESTATÍSTICAS E POSIÇÕES */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Legenda das Estatísticas</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-gray-600 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">PAC</span>
              <span>Ritmo (Velocidade + Aceleração)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">SHO</span>
              <span>Finalização (Chute + Finalização)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">PAS</span>
              <span>Passe</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">DRI</span>
              <span>Drible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">DEF</span>
              <span>Defesa (Desarme + Marcação)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">PHY</span>
              <span>Físico (Força + Resistência)</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Overall</span>
              <span>Média geral dos atributos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Potencial</span>
              <span>Valor máximo que pode atingir</span>
            </div>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-gray-700 mb-3">⚽ Legenda das Posições</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">GOL</span>
              <span>Goleiro</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">ZAG</span>
              <span>Zagueiro</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">LE</span>
              <span>Lateral Esquerdo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">LD</span>
              <span>Lateral Direito</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">VOL</span>
              <span>Volante</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">MC</span>
              <span>Meia Central</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">MO</span>
              <span>Meia Ofensivo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">ME</span>
              <span>Meia Esquerda</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">MD</span>
              <span>Meia Direita</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">PE</span>
              <span>Ponta Esquerda</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">PD</span>
              <span>Ponta Direita</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">ATA</span>
              <span>Atacante</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">SA</span>
              <span>Centroavante</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 