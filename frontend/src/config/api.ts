// Configuração da API
// Build timestamp: 2025-05-26T03:25:00Z - URLS FIXED + CORS FIX
const getApiUrl = (): string => {
  // HARDCODE: Sempre usar a URL de produção para resolver o problema de cache
  return 'https://kmizabot.h4xd66.easypanel.host';
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
  
  // Channels
  channels: {
    list: () => apiUrl('channels'),
    byId: (id: number) => apiUrl(`channels/${id}`),
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
  
  // Garantir que o path comece com uma barra
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

console.log('🔧 API Configuration HARDCODED:', {
  baseUrl: API_BASE_URL,
  hardcoded: true,
  buildTimestamp: '2025-05-26T03:25:00Z',
  finalFix: true
}); 