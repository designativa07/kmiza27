'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Info,
  RefreshCw,
  Server,
  Shield,
  Clock,
  FileText
} from 'lucide-react';

interface EnvironmentInfo {
  currentEnvironment: string;
  isDevelopment: boolean;
  hasProductionCredentials: boolean;
  developmentDatabase: string;
  productionDatabase: string;
}

interface ConnectionStatus {
  success: boolean;
  message: string;
  details?: {
    tablesCount: number;
    sampleTables: string[];
  };
}

interface SyncResult {
  success: boolean;
  message: string;
  details: {
    tablesProcessed: number;
    totalRowsCopied: number;
    tableResults: Array<{
      tableName: string;
      rowsCopied: number;
      success: boolean;
      error?: string;
    }>;
  };
}

export default function SyncPage() {
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    loadEnvironmentInfo();
    checkConnection();
  }, []);

  const loadEnvironmentInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/sync/environment-info`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setEnvironmentInfo(data);
    } catch (err) {
      console.error('Erro ao carregar informações do ambiente:', err);
    }
  };

  const checkConnection = async () => {
    setIsCheckingConnection(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/sync/check-production`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setConnectionStatus(data);
      
      if (data.success) {
        setSuccessMessage('Conexão com produção verificada com sucesso!');
      } else {
        setError(data.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao verificar conexão: ${errorMessage}`);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const syncFromProduction = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Esta operação irá substituir TODOS os dados do banco de desenvolvimento com os dados de produção. Esta ação não pode ser desfeita. Deseja continuar?')) {
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSuccessMessage(null);
    setSyncResult(null);
    
    try {
      const response = await fetch(`${API_URL}/sync/from-production`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncResult(data);
        setSuccessMessage(data.message);
      } else {
        setError(data.message || 'Erro durante sincronização');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro durante sincronização: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="mr-3 h-8 w-8 text-indigo-600" />
            Sincronização de Dados
          </h1>
          <p className="mt-2 text-gray-600">
            Sincronize dados de produção para o ambiente de desenvolvimento
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
              <div className="flex-1">
                <p className="text-red-800">{error}</p>
              </div>
              <button
                onClick={clearMessages}
                className="text-red-400 hover:text-red-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <div className="flex-1">
                <p className="text-green-800">{successMessage}</p>
              </div>
              <button
                onClick={clearMessages}
                className="text-green-400 hover:text-green-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações do Ambiente */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Server className="mr-2 h-5 w-5 text-indigo-600" />
              Informações do Ambiente
            </h2>

            {environmentInfo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Ambiente Atual:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    environmentInfo.isDevelopment 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {environmentInfo.currentEnvironment}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Modo Desenvolvimento:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    environmentInfo.isDevelopment 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {environmentInfo.isDevelopment ? 'Sim' : 'Não'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Credenciais Produção:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    environmentInfo.hasProductionCredentials 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {environmentInfo.hasProductionCredentials ? 'Configuradas' : 'Não Configuradas'}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600">
                    <p><strong>Banco Desenvolvimento:</strong> {environmentInfo.developmentDatabase}</p>
                    <p><strong>Banco Produção:</strong> {environmentInfo.productionDatabase}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Status da Conexão */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Shield className="mr-2 h-5 w-5 text-indigo-600" />
              Status da Conexão
            </h2>

            {connectionStatus ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  {connectionStatus.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className={`text-sm font-medium ${
                    connectionStatus.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {connectionStatus.message}
                  </span>
                </div>

                {connectionStatus.details && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Detalhes:</h4>
                    <p className="text-sm text-gray-600">
                      <strong>{connectionStatus.details.tablesCount}</strong> tabelas encontradas
                    </p>
                    {connectionStatus.details.sampleTables.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Exemplos de tabelas:</p>
                        <div className="flex flex-wrap gap-1">
                          {connectionStatus.details.sampleTables.map((table, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                              {table}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={checkConnection}
                disabled={isCheckingConnection}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isCheckingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Verificar Conexão
              </button>
            </div>
          </div>
        </div>

        {/* Aviso de Segurança */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                ⚠️ Aviso Importante
              </h3>
              <div className="text-yellow-700 space-y-2">
                <p>
                  <strong>Esta operação é irreversível!</strong> Todos os dados do banco de desenvolvimento serão substituídos pelos dados de produção.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Certifique-se de que está em ambiente de desenvolvimento</li>
                  <li>Faça backup dos dados locais se necessário</li>
                  <li>Esta operação pode demorar alguns minutos</li>
                  <li>O sistema ficará indisponível durante a sincronização</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Sincronização */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={syncFromProduction}
            disabled={isSyncing || !environmentInfo?.isDevelopment || !environmentInfo?.hasProductionCredentials}
            className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            {isSyncing ? 'Sincronizando...' : 'Sincronizar de Produção'}
          </button>
        </div>

        {/* Resultado da Sincronização */}
        {syncResult && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-indigo-600" />
              Resultado da Sincronização
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{syncResult.details.tablesProcessed}</p>
                    <p className="text-sm text-blue-700">Tabelas Processadas</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{syncResult.details.totalRowsCopied}</p>
                    <p className="text-sm text-green-700">Linhas Copiadas</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {syncResult.details.tableResults.filter(r => r.success).length}
                    </p>
                    <p className="text-sm text-purple-700">Sucessos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes por Tabela */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tabela
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Linhas Copiadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erro
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {syncResult.details.tableResults.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.tableName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.rowsCopied.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.success ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sucesso
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Erro
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {result.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
