import axios from 'axios';

export interface ResearchConfig {
  enabled: boolean;
  openAI: boolean;
  knowledgeBase: boolean;
  webSearch: boolean;
  maxTokens: number;
  temperature: number;
  confidenceThreshold: number;
}

export interface AIResearchStats {
  cacheSize: number;
  config: ResearchConfig;
  timestamp: string;
}

export interface AIResearchResult {
  success: boolean;
  answer?: string;
  confidence: number;
  source: string;
  reasoning?: string;
}

// Usar a mesma lógica de configuração da API
const getApiUrl = (): string => {
  // Para desenvolvimento local, usar a API local
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  
  // Para desenvolvimento sem window (Node.js), usar localhost
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }
  
  // Usar sempre a URL de produção (VPS) - SEM /api prefix
  return 'https://api.kmiza27.com';
};

const API_BASE_URL = getApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

class AIResearchService {
  /**
   * Busca configuração atual
   */
  async getConfig(): Promise<ResearchConfig> {
    const response = await api.get('/ai-research/config');
    return response.data;
  }

  /**
   * Atualiza configuração
   */
  async updateConfig(config: Partial<ResearchConfig>): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/ai-research/config', config);
    return response.data;
  }

  /**
   * Busca estatísticas de uso
   */
  async getStats(): Promise<AIResearchStats> {
    const response = await api.get('/ai-research/stats');
    return response.data;
  }

  /**
   * Limpa cache de respostas
   */
  async clearCache(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/ai-research/clear-cache');
    return response.data;
  }

  /**
   * Testa funcionalidade com uma pergunta
   */
  async testResearch(message: string): Promise<{
    success: boolean;
    result: AIResearchResult | null;
    message: string;
  }> {
    const response = await api.post('/ai-research/test', { message });
    return response.data;
  }
}

export default new AIResearchService();
