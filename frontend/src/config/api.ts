// Configuração da API
// Build timestamp: 2025-05-26T02:30:00Z - FORCE REBUILD
const getApiUrl = (): string => {
  // Em produção, usar a URL do backend no Easypanel
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://kmizabot.h4xd66.easypanel.host';
  }
  
  // Em desenvolvimento, usar localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

export const API_BASE_URL = getApiUrl();

// Helper para construir URLs da API
export const apiUrl = (endpoint: string): string => {
  // Remove barra inicial se existir
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// URLs específicas para diferentes serviços
export const API_ENDPOINTS = {
  // WhatsApp
  whatsapp: {
    status: () => apiUrl('whatsapp/status'),
    conversations: () => apiUrl('whatsapp/conversations'),
    conversationsFootball: () => apiUrl('whatsapp/conversations/football'),
    stats: () => apiUrl('whatsapp/stats'),
    conversationMessages: (id: string) => apiUrl(`whatsapp/conversations/${encodeURIComponent(id)}/messages`),
    sendMessage: (id: string) => apiUrl(`whatsapp/conversations/${encodeURIComponent(id)}/send`),
    refreshConversations: () => apiUrl('whatsapp/conversations/refresh'),
    clearCache: () => apiUrl('whatsapp/cache/clear'),
  },
  
  // Users
  users: {
    list: () => apiUrl('users'),
    stats: () => apiUrl('users/stats'),
    byId: (id: number) => apiUrl(`users/${id}`),
  },
  
  // Teams
  teams: {
    list: () => apiUrl('teams'),
    byId: (id: number) => apiUrl(`teams/${id}`),
    uploadLogo: (id: number) => apiUrl(`teams/${id}/upload-escudo`),
  },
  
  // Matches
  matches: {
    list: () => apiUrl('matches'),
    byId: (id: number) => apiUrl(`matches/${id}`),
  },
  
  // Competitions
  competitions: {
    list: () => apiUrl('competitions'),
    byId: (id: number) => apiUrl(`competitions/${id}`),
    teams: (id: number) => apiUrl(`competitions/${id}/teams`),
    teamById: (competitionId: number, teamId: number) => apiUrl(`competitions/${competitionId}/teams/${teamId}`),
  },
  
  // Notifications
  notifications: {
    list: () => apiUrl('notifications'),
    stats: () => apiUrl('notifications/stats'),
    byId: (id: number) => apiUrl(`notifications/${id}`),
    progress: (id: number) => apiUrl(`notifications/${id}/progress`),
    report: (id: number) => apiUrl(`notifications/${id}/report`),
    send: (id: number) => apiUrl(`notifications/${id}/send`),
    pause: (id: number) => apiUrl(`notifications/${id}/pause`),
    resume: (id: number) => apiUrl(`notifications/${id}/resume`),
    cancel: (id: number) => apiUrl(`notifications/${id}/cancel`),
  },
  
  // Standings
  standings: {
    byCompetition: (competitionId: number, group?: string) => {
      const url = apiUrl(`standings/competition/${competitionId}`);
      return group ? `${url}?group=${group}` : url;
    },
    groups: (competitionId: number) => apiUrl(`standings/competition/${competitionId}/groups`),
    teamStats: (competitionId: number, teamId: number) => apiUrl(`standings/competition/${competitionId}/team/${teamId}/stats`),
    headToHead: (competitionId: number, team1: number, team2: number) => apiUrl(`standings/competition/${competitionId}/head-to-head?team1=${team1}&team2=${team2}`),
    rounds: (competitionId: number) => apiUrl(`standings/competition/${competitionId}/rounds`),
    roundMatches: (competitionId: number, round: number) => apiUrl(`standings/competition/${competitionId}/round/${round}/matches`),
  },
  
  // Bot Config
  botConfig: {
    list: () => apiUrl('bot-config'),
    byId: (id: number) => apiUrl(`bot-config/${id}`),
    resetDefaults: () => apiUrl('bot-config/reset-defaults'),
  },
  
  // Chatbot
  chatbot: {
    status: () => apiUrl('chatbot/status'),
    testMessage: () => apiUrl('chatbot/test-message'),
  },
};

// Helper para URLs de imagens
export const imageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

console.log('🔧 API Configuration:', {
  baseUrl: API_BASE_URL,
  environment: process.env.NODE_ENV,
  publicApiUrl: process.env.NEXT_PUBLIC_API_URL,
  buildTimestamp: '2025-05-26T02:30:00Z'
}); 