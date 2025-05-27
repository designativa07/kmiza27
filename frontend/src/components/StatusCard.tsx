'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ServerIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

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

export default function StatusCard() {
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
    
    // Auto-refresh a cada 60 segundos
    const interval = setInterval(checkAllServices, 60000);
    return () => clearInterval(interval);
  }, []);

  const getOverallStatus = () => {
    const onlineServices = services.filter(s => s.status === 'online').length;
    const totalServices = services.length;
    
    if (onlineServices === totalServices) return 'online';
    if (onlineServices === 0) return 'offline';
    return 'partial';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'offline':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'partial':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      default:
        return <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Operacional';
      case 'offline':
        return 'Problemas';
      case 'partial':
        return 'Parcial';
      default:
        return 'Verificando...';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-red-600';
      case 'partial':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCommit = (commit?: string) => {
    if (!commit || commit === 'unknown') return 'N/A';
    return commit.substring(0, 8);
  };

  const averageResponseTime = Math.round(
    services.reduce((acc, s) => acc + (s.responseTime || 0), 0) / services.length
  ) || 0;

  const overallStatus = getOverallStatus();

  return (
    <div className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {getStatusIcon(overallStatus)}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Status do Sistema
              </h3>
              <p className={`text-sm font-semibold ${getStatusColor(overallStatus)}`}>
                {getStatusText(overallStatus)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={checkAllServices}
              disabled={isRefreshing}
              className="inline-flex items-center p-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              title="Atualizar status"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <Link
              href="/status"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ver Detalhes
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {services.filter(s => s.status === 'online').length}/{services.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Serviços Online
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {averageResponseTime}ms
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tempo de Resposta
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
              {formatCommit(services.find(s => s.name === 'Backend API')?.commit)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Último Deploy
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  service.status === 'online' 
                    ? 'bg-green-500' 
                    : service.status === 'offline' 
                    ? 'bg-red-500' 
                    : 'bg-gray-400'
                }`} />
                <span className="text-gray-900 dark:text-white font-medium">
                  {service.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                {service.responseTime && (
                  <span>{service.responseTime}ms</span>
                )}
                {service.version && (
                  <span>v{service.version}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Última atualização: {lastUpdate.toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
} 