// Configuração centralizada da API
export const API_CONFIG = {
  // URL base da API
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  
  // Timeout para requisições (em ms)
  timeout: 10000,
  
  // URLs de fallback para desenvolvimento
  fallbackURLs: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  
  // Verificar se estamos em produção
  isProduction: process.env.NODE_ENV === 'production',
  
  // Verificar se estamos no cliente
  isClient: typeof window !== 'undefined',
};

// Função para obter a URL da API com fallback
export function getApiUrl(): string {
  // Sempre usar a variável de ambiente se disponível
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Em produção, usar a URL pública
  if (API_CONFIG.isProduction) {
    return 'https://api.kmiza27.com';
  }
  
  // Em desenvolvimento, sempre usar localhost:3000
  return 'http://localhost:3000';
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