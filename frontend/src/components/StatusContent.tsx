'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ServerIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'loading';
  responseTime?: number;
  version?: string;
  commit?: string;
  timestamp?: string;
  error?: string;
}

interface StatusContentProps {
  standalone?: boolean;
}

export default function StatusContent({ standalone = false }: StatusContentProps) {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Backend API',
      url: 'https://kmizabot.h4xd66.easypanel.host/health',
      status: 'loading'
    },
    {
      name: 'Frontend',
      url: '/api/health',
      status: 'loading'
    }
  ]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [frontendCommit, setFrontendCommit] = useState<string | null>(null);

  const checkServiceStatus = async (service: ServiceStatus): Promise<ServiceStatus> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(service.url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          ...service,
          status: 'online',
          responseTime,
          version: data.version,
          commit: data.commit,
          timestamp: data.timestamp
        };
      } else {
        return {
          ...service,
          status: 'offline',
          responseTime,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        ...service,
        status: 'offline',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const checkAllServices = async () => {
    setIsRefreshing(true);
    
    const updatedServices = await Promise.all(
      services.map(service => checkServiceStatus(service))
    );
    
    setServices(updatedServices);
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkAllServices();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Busca o commit do frontend do arquivo público caso não venha do health
    fetch('/commit.txt')
      .then(res => res.text())
      .then(text => setFrontendCommit(text.trim()))
      .catch(() => setFrontendCommit(null));
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'offline':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'loading':
        return <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800';
      case 'offline':
        return 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800';
      case 'loading':
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-700';
    }
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return '-';
    return `${time}ms`;
  };

  const formatCommit = (commit?: string) => {
    if (!commit || commit === 'unknown') return 'Desconhecido';
    return commit.substring(0, 8);
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const containerClass = standalone 
    ? "min-h-screen bg-gray-50 dark:bg-slate-900 p-6"
    : "space-y-6";

  const contentClass = standalone 
    ? "max-w-6xl mx-auto"
    : "";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Status do Sistema
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Monitoramento em tempo real dos serviços Kmiza27
              </p>
            </div>
            <button
              onClick={checkAllServices}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Última atualização: {lastUpdate.toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <ServerIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Serviços Online
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {services.filter(s => s.status === 'online').length}/{services.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tempo de Resposta
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(services.reduce((acc, s) => acc + (s.responseTime || 0), 0) / services.length) || 0}ms
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <GlobeAltIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Status Geral
                </h3>
                <p className={`text-2xl font-bold ${
                  services.every(s => s.status === 'online') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {services.every(s => s.status === 'online') ? 'Operacional' : 'Problemas'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Detail */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Detalhes dos Serviços
          </h2>
          
          {services.map((service, index) => (
            <div
              key={index}
              className={`border rounded-lg p-6 ${getStatusColor(service.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {service.url}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    service.status === 'online' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : service.status === 'offline'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {service.status === 'online' ? 'Online' : service.status === 'offline' ? 'Offline' : 'Verificando...'}
                  </div>
                </div>
              </div>

              {service.status !== 'loading' && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tempo de Resposta:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatResponseTime(service.responseTime)}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Versão:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {service.version || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Commit:</span>
                    <p className="font-medium text-gray-900 dark:text-white font-mono">
                      {service.name === 'Frontend' && !service.commit && frontendCommit
                        ? frontendCommit.substring(0, 8)
                        : formatCommit(service.commit)}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Última Atualização:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatTimestamp(service.timestamp)}
                    </p>
                  </div>
                </div>
              )}

              {service.error && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <strong>Erro:</strong> {service.error}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Deploy Info */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CodeBracketIcon className="h-6 w-6 mr-2" />
            Informações de Deploy
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Como verificar se deploy foi aplicado:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Compare os commits do Backend e Frontend</li>
                <li>• Verifique se as versões são iguais</li>
                <li>• Observe o timestamp da última atualização</li>
                <li>• Status deve estar "Online" para ambos</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Comandos úteis:</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <code className="block bg-gray-100 dark:bg-slate-700 p-2 rounded">npm run status</code>
                <code className="block bg-gray-100 dark:bg-slate-700 p-2 rounded">npm run status:watch</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 