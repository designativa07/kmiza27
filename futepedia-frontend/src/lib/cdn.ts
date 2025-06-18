/**
 * Utilitários para gerenciar URLs do CDN de imagens
 * Compatível com SSR (Server-Side Rendering)
 */

const CDN_BASE_URL = 'https://cdn.kmiza27.com';

// Verificar se estamos no servidor ou cliente
const isServer = typeof window === 'undefined';

/**
 * Gera URL do escudo do time
 * @param logoUrl - URL original do logo (pode ser relativa ou completa)
 * @returns URL completa do CDN ou fallback
 */
export function getTeamLogoUrl(logoUrl: string | null | undefined): string {
  try {
    if (!logoUrl) {
      return '/default-team-logo.svg';
    }

    // Se já é uma URL completa do CDN, usar diretamente
    if (logoUrl.startsWith('https://cdn.kmiza27.com')) {
      return logoUrl;
    }

    // Se é uma URL relativa local (/uploads/escudos/...), converter para CDN
    if (logoUrl.startsWith('/uploads/escudos/')) {
      const filename = logoUrl.replace('/uploads/escudos/', '');
      return `${CDN_BASE_URL}/img/escudos/${filename}`;
    }

    // Se é uma URL relativa (/img/...), converter para CDN
    if (logoUrl.startsWith('/img/')) {
      return `${CDN_BASE_URL}${logoUrl}`;
    }

    // Se é apenas o nome do arquivo, assumir que está em escudos
    if (!logoUrl.includes('/') && (logoUrl.endsWith('.svg') || logoUrl.endsWith('.png') || logoUrl.endsWith('.jpg'))) {
      return `${CDN_BASE_URL}/img/escudos/${logoUrl}`;
    }

    // Fallback para URLs externas ou casos não cobertos
    return logoUrl;
  } catch (error) {
    // Em caso de erro, retornar fallback
    if (isServer) {
      console.warn('Erro na função getTeamLogoUrl:', error);
    }
    return '/default-team-logo.svg';
  }
}

/**
 * Gera URL do logo da competição
 * @param logoUrl - URL original do logo
 * @returns URL completa do CDN ou fallback
 */
export function getCompetitionLogoUrl(logoUrl: string | null | undefined): string {
  try {
    if (!logoUrl) {
      return '/default-competition-logo.svg';
    }

    // Se já é uma URL completa do CDN, usar diretamente
    if (logoUrl.startsWith('https://cdn.kmiza27.com')) {
      return logoUrl;
    }

    // Se é uma URL relativa (/img/logo-competition/...), converter para CDN
    if (logoUrl.startsWith('/img/logo-competition/')) {
      return `${CDN_BASE_URL}${logoUrl}`;
    }

    // Se é apenas o nome do arquivo, assumir que está em logo-competition
    if (!logoUrl.includes('/') && (logoUrl.endsWith('.svg') || logoUrl.endsWith('.png') || logoUrl.endsWith('.jpg'))) {
      return `${CDN_BASE_URL}/img/logo-competition/${logoUrl}`;
    }

    return logoUrl;
  } catch (error) {
    // Em caso de erro, retornar fallback
    if (isServer) {
      console.warn('Erro na função getCompetitionLogoUrl:', error);
    }
    return '/default-competition-logo.svg';
  }
}

/**
 * Gera URL da foto do jogador
 * @param imageUrl - URL original da imagem
 * @returns URL completa do CDN ou fallback
 */
export function getPlayerImageUrl(imageUrl: string | null | undefined): string {
  try {
    if (!imageUrl) {
      return '/default-player-photo.svg';
    }

    // Se já é uma URL completa do CDN, usar diretamente
    if (imageUrl.startsWith('https://cdn.kmiza27.com')) {
      return imageUrl;
    }

    // Se é uma URL relativa (/img/players/...), converter para CDN
    if (imageUrl.startsWith('/img/players/')) {
      return `${CDN_BASE_URL}${imageUrl}`;
    }

    return imageUrl;
  } catch (error) {
    // Em caso de erro, retornar fallback
    if (isServer) {
      console.warn('Erro na função getPlayerImageUrl:', error);
    }
    return '/default-player-photo.svg';
  }
}

/**
 * Manipulador de erro para imagens - compatível com SSR
 * @param event - Evento de erro da imagem
 * @param fallbackSrc - URL de fallback
 */
export function handleImageError(event: any, fallbackSrc: string): void {
  // Verificar se estamos no cliente (não no servidor)
  if (isServer) {
    return;
  }
  
  try {
    const target = event?.currentTarget || event?.target;
    if (target && target.src !== fallbackSrc) {
      target.src = fallbackSrc;
    }
  } catch (error) {
    console.warn('Erro ao definir fallback de imagem:', error);
  }
} 