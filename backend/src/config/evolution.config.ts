export const evolutionConfig = {
  apiUrl: process.env.EVOLUTION_API_URL || 'https://kmiza27-evolution.h4xd66.easypanel.host',
  apiKey: process.env.EVOLUTION_API_KEY || '95DC243F41B2-4858-B0F1-FF49D8C46A85',
  instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'kmizabot',
  enabled: true, // Sempre habilitado - usar apenas dados reais
  
  // Endpoints da Evolution API
  endpoints: {
    sendMessage: '/message/sendText',
    instanceInfo: '/instance/fetchInstances',
    createInstance: '/instance/create',
  }
}; 