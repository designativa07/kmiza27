/**
 * Utilitários para gerenciar identificadores únicos de usuários do chat público
 */

/**
 * Gera ou recupera o ID único do usuário para o chat do site
 * Se não existir, cria um novo UUID e salva no localStorage
 */
export function getOrCreateSiteUserId(): string {
  // Verificar se estamos no ambiente do navegador
  if (typeof window === 'undefined') {
    // Se estivermos no servidor (SSR), retornar um ID temporário
    return 'site-temp-' + Math.random().toString(36).substr(2, 9);
  }

  let id = localStorage.getItem('futepedia_site_user_id');
  
  if (!id) {
    // Gerar novo UUID com prefixo 'site-'
    id = 'site-' + crypto.randomUUID();
    localStorage.setItem('futepedia_site_user_id', id);
    console.log('🆔 Novo ID de usuário gerado:', id);
  }
  
  return id;
}

/**
 * Limpa o ID do usuário do localStorage
 * Útil para testes ou reset de sessão
 */
export function clearSiteUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('futepedia_site_user_id');
    console.log('🗑️ ID de usuário removido');
  }
}

/**
 * Verifica se o usuário já tem um ID salvo
 */
export function hasSiteUserId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return localStorage.getItem('futepedia_site_user_id') !== null;
}

/**
 * Gera um nome de usuário amigável para exibição
 * baseado no ID do usuário
 */
export function generateDisplayName(userId: string): string {
  if (userId.startsWith('site-')) {
    // Pegar os últimos 6 caracteres do UUID para criar um nome único
    const shortId = userId.slice(-6).toUpperCase();
    return `Visitante ${shortId}`;
  }
  
  return 'Usuário';
} 