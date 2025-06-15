// Configuração centralizada da API
export const API_CONFIG = {
  // URL base da API
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  
  // Timeout para requisições (em ms)
  timeout: 10000,
  
  // URLs de fallback para desenvolvimento
  fallbackURLs: [
    'http://localhost:3000/api',
    'http://127.0.0.1:3000/api',
  ],
  
  // Verificar se estamos em produção
  isProduction: process.env.NODE_ENV === 'production',
  
  // Verificar se estamos no cliente
  isClient: typeof window !== 'undefined',
};

// Função para obter a URL da API com fallback
export function getApiUrl(): string {
  // Se estivermos no servidor durante o build, usar localhost
  if (!API_CONFIG.isClient && !API_CONFIG.isProduction) {
    return 'http://localhost:3000/api';
  }
  
  return API_CONFIG.baseURL;
}

// Função para fazer fetch com tratamento de erro robusto
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${getApiUrl()}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
} 