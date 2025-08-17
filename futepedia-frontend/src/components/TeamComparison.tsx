'use client';

import { useState, useEffect } from 'react';
import { Search, Users, BarChart3, Trophy, AlertTriangle, Target, Shield } from 'lucide-react';
import { getTeamLogoUrl } from '@/lib/cdn-simple';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Tipos... (iguais ao anterior)
interface TeamSummary {
  id: number;
  name: string;
  logo_url: string;
}

interface TeamComparisonData {
  team1: {
    id: number;
    name: string;
    logo_url: string;
    averageDifficulty: number;
  };
  team2: {
    id: number;
    name: string;
    logo_url: string;
    averageDifficulty: number;
  };
  comparison: {
    difficultyDifference: number;
    easierSchedule: 'team1' | 'team2' | 'equal';
    advantage: number;
  };
}

interface TeamStatistics {
  totals: {
    points: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
  };
  matches: {
    home: { played: number; points: number; won: number; };
    away: { played: number; points: number; won: number; };
  };
}

interface TeamComparisonProps {
  currentTeamId: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Componente para o gráfico de barras
const ComparisonBarChart = ({ data, team1Name, team2Name }: { data: any, team1Name: string, team2Name: string }) => {
  const COLORS = ['#3b82f6', '#ef4444']; // Azul para time 1, Vermelho para time 2

  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={[data]} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" hide />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        />
        <Bar dataKey="team1" name={team1Name} stackId="a" fill={COLORS[0]} barSize={20} />
        <Bar dataKey="team2" name={team2Name} stackId="a" fill={COLORS[1]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
};


export function TeamComparison({ currentTeamId }: TeamComparisonProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableTeams, setAvailableTeams] = useState<TeamSummary[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamSummary[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [comparisonData, setComparisonData] = useState<TeamComparisonData | null>(null);
  const [currentTeamStats, setCurrentTeamStats] = useState<TeamStatistics | null>(null);
  const [selectedTeamStats, setSelectedTeamStats] = useState<TeamStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efeitos... (iguais ao anterior, sem mudanças na lógica de busca de dados)
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`${API_URL}/teams/all`);
        if (response.ok) {
          const teams = await response.json();
          if (Array.isArray(teams)) {
            const otherTeams = teams.filter((team: TeamSummary) => team.id !== currentTeamId);
            setAvailableTeams(otherTeams);
            setFilteredTeams(otherTeams);
          }
        } else {
          setError(`Erro ao carregar times: ${response.statusText}`);
        }
      } catch (err) {
        setError(`Erro de conexão ao carregar times.`);
      }
    };
    fetchTeams();
  }, [currentTeamId]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = availableTeams.filter(team =>
      team.name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredTeams(filtered);
  }, [searchTerm, availableTeams]);

  useEffect(() => {
    if (selectedTeamId) {
      compareTeams();
    }
  }, [selectedTeamId, currentTeamId]);

  const compareTeams = async () => {
    if (!selectedTeamId) return;
    setLoading(true);
    setError(null);
    try {
      const [comparisonResponse, currentStatsResponse, selectedStatsResponse] = await Promise.all([
        fetch(`${API_URL}/teams/${currentTeamId}/comparison/${selectedTeamId}`),
        fetch(`${API_URL}/teams/${currentTeamId}/statistics`),
        fetch(`${API_URL}/teams/${selectedTeamId}/statistics`)
      ]);
      if (!comparisonResponse.ok || !currentStatsResponse.ok || !selectedStatsResponse.ok) {
        throw new Error('Falha ao carregar dados de comparação.');
      }
      const [comparison, currentStats, selectedStats] = await Promise.all([
        comparisonResponse.json(),
        currentStatsResponse.json(),
        selectedStatsResponse.json(),
      ]);
      setComparisonData(comparison);
      setCurrentTeamStats(currentStats);
      setSelectedTeamStats(selectedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h5 className="font-semibold text-gray-700 mb-3 flex items-center text-sm">
        <Icon className="h-4 w-4 mr-2 text-indigo-500" />
        {title}
      </h5>
      <div className="space-y-2">{children}</div>
    </div>
  );

  const StatRow = ({ label, team1Value, team2Value, team1Name, team2Name, invertColors = false }) => {
    const isTeam1Better = invertColors ? team1Value < team2Value : team1Value > team2Value;
    const isTeam2Better = invertColors ? team2Value < team1Value : team2Value > team1Value;
    
    return (
      <div>
        <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
          <span className={`font-bold ${isTeam1Better ? 'text-blue-600' : ''}`}>{team1Value}</span>
          <span>{label}</span>
          <span className={`font-bold ${isTeam2Better ? 'text-red-600' : ''}`}>{team2Value}</span>
        </div>
        <div className="flex w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <div 
             className="h-2.5 rounded-l-full comparison-bar-team1" 
             style={{ width: `${(team1Value / (team1Value + team2Value || 1)) * 100}%` }}
           ></div>
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <div 
             className="h-2.5 rounded-r-full comparison-bar-team2" 
             style={{ width: `${(team2Value / (team1Value + team2Value || 1)) * 100}%` }}
           ></div>
        </div>
      </div>
    );
  };
  
  const renderComparison = () => {
    if (!comparisonData || !currentTeamStats || !selectedTeamStats) return null;

    const { team1, team2 } = comparisonData;

    const stats = [
      { label: 'Pontos', t1: currentTeamStats.totals.points, t2: selectedTeamStats.totals.points },
      { label: 'Vitórias', t1: currentTeamStats.totals.won, t2: selectedTeamStats.totals.won },
      { label: 'Gols Marcados', t1: currentTeamStats.totals.goalsFor, t2: selectedTeamStats.totals.goalsFor },
      { label: 'Saldo de Gols', t1: currentTeamStats.totals.goalDifference, t2: selectedTeamStats.totals.goalDifference },
      { label: 'Gols Sofridos', t1: currentTeamStats.totals.goalsAgainst, t2: selectedTeamStats.totals.goalsAgainst, invert: true },
    ];
    
    const homeStats = [
        { label: 'Jogos', t1: currentTeamStats.matches.home.played, t2: selectedTeamStats.matches.home.played },
        { label: 'Pontos', t1: currentTeamStats.matches.home.points, t2: selectedTeamStats.matches.home.points },
        { label: 'Vitórias', t1: currentTeamStats.matches.home.won, t2: selectedTeamStats.matches.home.won },
    ];

    const awayStats = [
        { label: 'Jogos', t1: currentTeamStats.matches.away.played, t2: selectedTeamStats.matches.away.played },
        { label: 'Pontos', t1: currentTeamStats.matches.away.points, t2: selectedTeamStats.matches.away.points },
        { label: 'Vitórias', t1: currentTeamStats.matches.away.won, t2: selectedTeamStats.matches.away.won },
    ];

    return (
      <div className="space-y-4 mt-4">
        {/* Cabeçalho */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-3 gap-2 items-center">
                <div className="text-center">
                    <img src={getTeamLogoUrl(team1.logo_url)} alt={team1.name} className="w-12 h-12 mx-auto mb-1" />
                    <h3 className="font-bold text-sm text-gray-800 truncate">{team1.name}</h3>
                    <p className="text-xs text-gray-500">Dificuldade: {team1.averageDifficulty}</p>
                </div>
                <div className="text-center">
                    <div className="text-xl font-bold text-gray-700">VS</div>
                </div>
                <div className="text-center">
                    <img src={getTeamLogoUrl(team2.logo_url)} alt={team2.name} className="w-12 h-12 mx-auto mb-1" />
                    <h3 className="font-bold text-sm text-gray-800 truncate">{team2.name}</h3>
                    <p className="text-xs text-gray-500">Dificuldade: {team2.averageDifficulty}</p>
                </div>
            </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="Campanha Geral" icon={Trophy}>
                {stats.map(s => (
                    <StatRow key={s.label} label={s.label} team1Value={s.t1} team2Value={s.t2} team1Name={team1.name} team2Name={team2.name} invertColors={s.invert}/>
                ))}
            </StatCard>
            <div className="grid grid-rows-2 gap-4">
               <StatCard title="Desempenho em Casa" icon={Shield}>
                  {homeStats.map(s => <StatRow key={s.label} label={s.label} team1Value={s.t1} team2Value={s.t2} />)}
               </StatCard>
               <StatCard title="Desempenho Fora" icon={Shield}>
                  {awayStats.map(s => <StatRow key={s.label} label={s.label} team1Value={s.t1} team2Value={s.t2} />)}
               </StatCard>
            </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
        <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                Comparar com Outro Time
            </h4>
            <p className="text-gray-600 text-sm mb-3">
                Selecione um time para comparar estatísticas detalhadas e dificuldade de tabela.
            </p>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar time..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>
        </div>

        {filteredTeams.length > 0 && (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1">
                {filteredTeams.map((team) => (
                    <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={`flex items-center space-x-2 p-2 rounded-lg text-left text-sm hover:bg-gray-100 transition-colors border ${
                            selectedTeamId === team.id ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200'
                        }`}
                    >
                        <img src={getTeamLogoUrl(team.logo_url)} alt={team.name} className="w-5 h-5" />
                        <span className="truncate">{team.name}</span>
                    </button>
                ))}
            </div>
        )}

        {loading && <div className="text-center py-6">Carregando comparação...</div>}
        {error && <div className="text-center py-6 text-red-500">{error}</div>}
        {!loading && !error && renderComparison()}
    </div>
  );
}