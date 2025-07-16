/**
 * Utilitários para gerenciar URLs do CDN de imagens
 * Compatível com SSR (Server-Side Rendering)
 */

const CDN_BASE_URL = 'https://cdn.kmiza27.com';

// Verificar se estamos no servidor ou cliente
const isServer = typeof window === 'undefined';

/**
 * Gera URL da logo da Futepédia (cabeçalho)
 * @param logoUrl - URL original da logo (pode ser relativa ou completa)
 * @returns URL completa do CDN ou fallback
 */
export function getFutepediaLogoUrl(logoUrl: string | null | undefined): string {
  try {
    if (!logoUrl) {
      return '/kmiza27_logo30px.gif'; // Fallback padrão
    }

    // Se já é uma URL completa do CDN, usar diretamente
    if (logoUrl.startsWith('https://cdn.kmiza27.com') || logoUrl.startsWith('http')) {
      return logoUrl;
    }

    // Se é uma URL relativa (/img/...), converter para CDN
    if (logoUrl.startsWith('/img/')) {
      return `${CDN_BASE_URL}${logoUrl}`;
    }

    // Se é uma URL relativa local (/uploads/...), converter para CDN
    if (logoUrl.startsWith('/uploads/')) {
      const filename = logoUrl.replace('/uploads/', '');
      return `${CDN_BASE_URL}/img/${filename}`;
    }

    // Se é uma URL relativa simples (como /kmiza27_logo30px.gif), 
    // assumir que está na raiz do CDN
    if (logoUrl.startsWith('/')) {
      return `${CDN_BASE_URL}/img${logoUrl}`;
    }

    // Se é apenas o nome do arquivo
    if (!logoUrl.includes('/')) {
      return `${CDN_BASE_URL}/img/${logoUrl}`;
    }

    // Fallback para casos não cobertos
    return logoUrl;
  } catch (error) {
    // Em caso de erro, retornar fallback
    if (isServer) {
      console.warn('Erro na função getFutepediaLogoUrl:', error);
    }
    return '/kmiza27_logo30px.gif';
  }
}

/**
 * Gera URL da OG Image da Futepédia
 * @param imageUrl - URL original da OG Image (pode ser relativa ou completa)
 * @returns URL completa do CDN ou fallback
 */
export function getFutepediaOgImageUrl(imageUrl: string | null | undefined): string {
  try {
    if (!imageUrl) {
      return '/kmiza27_logo30px.gif'; // Fallback padrão
    }

    // Se já é uma URL completa do CDN, usar diretamente
    if (imageUrl.startsWith('https://cdn.kmiza27.com') || imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // Se é uma URL relativa (/img/...), converter para CDN
    if (imageUrl.startsWith('/img/')) {
      return `${CDN_BASE_URL}${imageUrl}`;
    }

    // Se é uma URL relativa local (/uploads/...), converter para CDN
    if (imageUrl.startsWith('/uploads/')) {
      const filename = imageUrl.replace('/uploads/', '');
      return `${CDN_BASE_URL}/img/${filename}`;
    }

    // Se é uma URL relativa simples (como /og-image.jpg), 
    // assumir que está na pasta og-images do CDN
    if (imageUrl.startsWith('/')) {
      return `${CDN_BASE_URL}/img/og-images${imageUrl}`;
    }

    // Se é apenas o nome do arquivo, assumir que está em og-images
    if (!imageUrl.includes('/')) {
      return `${CDN_BASE_URL}/img/og-images/${imageUrl}`;
    }

    // Fallback para casos não cobertos
    return imageUrl;
  } catch (error) {
    // Em caso de erro, retornar fallback
    if (isServer) {
      console.warn('Erro na função getFutepediaOgImageUrl:', error);
    }
    return '/kmiza27_logo30px.gif';
  }
}

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
 * Gera URL da imagem do estádio
 * @param imageUrl - URL original da imagem
 * @returns URL completa do CDN ou fallback
 */
export function getStadiumImageUrl(imageUrl: string | null | undefined): string {
  try {
    if (!imageUrl) {
      return '/default-stadium-photo.svg';
    }

    // Se já é uma URL completa do CDN, usar diretamente
    if (imageUrl.startsWith('https://cdn.kmiza27.com')) {
      return imageUrl;
    }

    // Se é uma URL relativa (/uploads/estadios/...), converter para CDN
    if (imageUrl.startsWith('/uploads/estadios/')) {
      const filename = imageUrl.replace('/uploads/estadios/', '');
      return `${CDN_BASE_URL}/img/estadios/${filename}`;
    }

    // Se é uma URL relativa (/img/estadios/...), converter para CDN
    if (imageUrl.startsWith('/img/estadios/')) {
      return `${CDN_BASE_URL}${imageUrl}`;
    }

    // Se é apenas o nome do arquivo, assumir que está em estadios
    if (!imageUrl.includes('/') && (imageUrl.endsWith('.svg') || imageUrl.endsWith('.png') || imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg'))) {
      return `${CDN_BASE_URL}/img/estadios/${imageUrl}`;
    }

    return imageUrl;
  } catch (error) {
    // Em caso de erro, retornar fallback
    if (isServer) {
      console.warn('Erro na função getStadiumImageUrl:', error);
    }
    return '/default-stadium-photo.svg';
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