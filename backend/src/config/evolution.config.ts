export const evolutionConfig = {
  apiUrl: process.env.EVOLUTION_API_URL || 'https://evolution.kmiza27.com',
  apiKey: process.env.EVOLUTION_API_KEY || '7C761B66EE97-498A-A058-E27A33A4AD78',
  instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'Kmiza27',
  enabled: true, // Sempre habilitado - usar apenas dados reais
  
  // Endpoints da Evolution API
  endpoints: {
    sendMessage: '/message/sendText',
    instanceInfo: '/instance/fetchInstances',
    createInstance: '/instance/create',
  }
}; 