'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  BarChart3, 
  Calendar, 
  Clock, 
  Trophy, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  Loader2,
  History,
  Settings,
  Info
} from 'lucide-react';

interface SimulationStats {
  total_simulations: number;
  latest_execution: string | null;
  competitions_with_simulations: number;
  average_execution_time_ms: number;
}

interface SimulationHistoryEntry {
  id: number;
  execution_date: string;
  simulation_count: number;
  executed_by: string;
  execution_duration_ms: number;
  algorithm_version: string;
  is_latest: boolean;
}

interface SimulationRequest {
  competitionId: number;
  simulationCount: number;
}

interface SimulationResult {
  id: number;
  execution_date: string;
  simulation_count: number;
  execution_duration_ms: number;
  team_predictions: Array<{
    team_id: number;
    team_name: string;
    title_probability: number;
    relegation_probability: number;
    current_position: number;
  }>;
}

export default function SimulationsPage() {
  const [selectedCompetition, setSelectedCompetition] = useState<number>(1); // Série A por padrão
  const [simulationCount, setSimulationCount] = useState<number>(1000);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stats, setStats] = useState<SimulationStats | null>(null);
  const [history, setHistory] = useState<SimulationHistoryEntry[]>([]);
  const [latestResult, setLatestResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const competitions = [
    { id: 1, name: 'Brasileirão Série A' },
    { id: 2, name: 'Brasileirão Série B' }
  ];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    loadStats();
    loadHistory();
    loadLatestSimulation();
  }, [selectedCompetition]);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/simulations/admin/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/simulations/history?competitionId=${selectedCompetition}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const loadLatestSimulation = async () => {
    try {
      const response = await fetch(`${API_URL}/simulations/latest/${selectedCompetition}`);
      const data = await response.json();
      if (data.success && data.data) {
        setLatestResult(data.data);
      } else {
        setLatestResult(null);
      }
    } catch (err) {
      console.error('Erro ao carregar última simulação:', err);
    }
  };

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const request: SimulationRequest = {
        competitionId: selectedCompetition,
        simulationCount: simulationCount,
      };

      const response = await fetch(`${API_URL}/simulations/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Simulação executada com sucesso em ${data.data.execution_duration_ms}ms!`);
        await loadStats();
        await loadHistory();
        await loadLatestSimulation();
      } else {
        setError(data.message || 'Erro ao executar simulação');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
      console.error('Erro ao executar simulação:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <BarChart3 className="inline-block mr-3 h-8 w-8 text-indigo-600" />
          Simulações Monte Carlo
        </h1>
        <p className="text-gray-600">
          Execute simulações preditivas para calcular probabilidades de título e rebaixamento
        </p>
      </div>

      {/* Estatísticas Gerais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Simulações</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_simulations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Competições</p>
                <p className="text-2xl font-bold text-gray-900">{stats.competitions_with_simulations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(stats.average_execution_time_ms)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Última Execução</p>
                <p className="text-sm font-bold text-gray-900">
                  {stats.latest_execution 
                    ? formatDate(stats.latest_execution)
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Painel de Controle */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Settings className="mr-2 h-5 w-5 text-indigo-600" />
            Painel de Controle
          </h2>

          <div className="space-y-6">
            {/* Seletor de Competição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competição
              </label>
              <select
                value={selectedCompetition}
                onChange={(e) => setSelectedCompetition(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isRunning}
                aria-label="Selecione a competição"
              >
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Controle de Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Simulações: {simulationCount.toLocaleString()}
              </label>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={simulationCount}
                onChange={(e) => setSimulationCount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isRunning}
                aria-label={`Número de simulações: ${simulationCount}`}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>100</span>
                <span>5.000</span>
                <span>10.000</span>
              </div>
            </div>

            {/* Botão de Execução */}
            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white transition-colors`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Executando Simulação...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Executar Simulação
                </>
              )}
            </button>

            {/* Mensagens */}
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700 text-sm">{successMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Resultados da Última Simulação */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-green-600" />
            Última Simulação
          </h2>

          {latestResult ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Executada em:</span>
                    <p className="font-medium">{formatDate(latestResult.execution_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Simulações:</span>
                    <p className="font-medium">{latestResult.simulation_count.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duração:</span>
                    <p className="font-medium">{formatDuration(latestResult.execution_duration_ms)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Times:</span>
                    <p className="font-medium">{latestResult.team_predictions.length}</p>
                  </div>
                </div>
              </div>

              {/* Top 3 Candidatos ao Título */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Trophy className="mr-1 h-4 w-4 text-yellow-500" />
                  Top 3 - Chances de Título
                </h3>
                <div className="space-y-2">
                  {latestResult.team_predictions
                    .sort((a, b) => b.title_probability - a.title_probability)
                    .slice(0, 3)
                    .map((team, index) => (
                      <div key={team.team_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            'bg-amber-200 text-amber-800'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium">{team.team_name}</span>
                        </div>
                        <span className="font-bold text-green-600">
                          {team.title_probability.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top 3 Risco de Rebaixamento */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                  Top 3 - Risco de Rebaixamento
                </h3>
                <div className="space-y-2">
                  {latestResult.team_predictions
                    .sort((a, b) => b.relegation_probability - a.relegation_probability)
                    .slice(0, 3)
                    .map((team, index) => (
                      <div key={team.team_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold mr-3">
                            {index + 1}
                          </span>
                          <span className="font-medium">{team.team_name}</span>
                        </div>
                        <span className="font-bold text-red-600">
                          {team.relegation_probability.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Info className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma simulação encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Execute a primeira simulação para ver os resultados aqui.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Simulações */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <History className="mr-2 h-5 w-5 text-blue-600" />
          Histórico de Simulações
        </h2>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Simulações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Executado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(entry.execution_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.simulation_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(entry.execution_duration_ms)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.executed_by}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.is_latest ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Atual
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Histórico
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum histórico encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              As simulações executadas aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
