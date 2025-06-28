/**
 * Utilitários para gerenciar URLs do CDN de imagens no painel admin
 */

const CDN_BASE_URL = 'https://cdn.kmiza27.com';

/**
 * Gera URL do escudo do time
 * @param logoUrl - URL original do logo (pode ser relativa ou completa)
 * @returns URL completa do CDN ou fallback
 */
export function getTeamLogoUrl(logoUrl: string | null | undefined): string {
  if (!logoUrl) {
    return generateFallbackUrl('team');
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

  // Se é uma URL externa (http/https), usar como está
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }

  // Fallback para URLs não reconhecidas
  return generateFallbackUrl('team');
}

/**
 * Gera URL do logo da competição
 * @param logoUrl - URL original do logo
 * @returns URL completa do CDN ou fallback
 */
export function getCompetitionLogoUrl(logoUrl: string | null | undefined): string {
  if (!logoUrl) {
    return generateFallbackUrl('competition');
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

  // Se é uma URL externa (http/https), usar como está
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }

  return generateFallbackUrl('competition');
}

/**
 * Gera URL da foto do jogador
 * @param imageUrl - URL original da imagem
 * @returns URL completa do CDN ou fallback
 */
export function getPlayerImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return generateFallbackUrl('player');
  }

  // Se já é uma URL completa do CDN, usar diretamente
  if (imageUrl.startsWith('https://cdn.kmiza27.com')) {
    return imageUrl;
  }

  // Se é uma URL relativa (/img/players/...), converter para CDN
  if (imageUrl.startsWith('/img/players/')) {
    return `${CDN_BASE_URL}${imageUrl}`;
  }

  // Se é uma URL externa (http/https), usar como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  return generateFallbackUrl('player');
}

/**
 * Gera URL da imagem do estádio
 * @param imageUrl - URL original da imagem
 * @returns URL completa do CDN ou fallback
 */
export function getStadiumImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return generateFallbackUrl('stadium');
  }

  // Se já é uma URL completa do CDN, usar diretamente
  if (imageUrl.startsWith('https://cdn.kmiza27.com')) {
    return imageUrl;
  }

  // Se é uma URL relativa (/img/estadios/...), converter para CDN
  if (imageUrl.startsWith('/img/estadios/')) {
    return `${CDN_BASE_URL}${imageUrl}`;
  }

  // Se é uma URL relativa legada (/uploads/estadios/...), converter para CDN
  if (imageUrl.startsWith('/uploads/estadios/')) {
    const filename = imageUrl.replace('/uploads/estadios/', '');
    return `${CDN_BASE_URL}/img/estadios/${filename}`;
  }

  // Se é uma URL externa (http/https), usar como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  return generateFallbackUrl('stadium');
}

/**
 * Gera URLs de fallback usando UI Avatars para nomes
 */
function generateFallbackUrl(type: 'team' | 'competition' | 'player' | 'stadium', name?: string): string {
  const colors = {
    team: { bg: '10B981', color: 'FFFFFF' },
    competition: { bg: '6366F1', color: 'FFFFFF' }, 
    player: { bg: 'F59E0B', color: 'FFFFFF' },
    stadium: { bg: '84CC16', color: 'FFFFFF' } // Verde-limão para estádios
  };

  const labels = {
    team: 'TIME',
    competition: 'COMP',
    player: 'JOGADOR',
    stadium: 'ESTÁDIO'
  };

  const color = colors[type];
  const label = name || labels[type];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=${color.bg}&color=${color.color}&size=80`;
}

/**
 * Versão compatível com API existente - substitui a função imageUrl
 * @param path - Caminho da imagem
 * @returns URL otimizada
 */
export function imageUrl(path: string): string {
  if (!path) return generateFallbackUrl('team');
  
  // Se já é uma URL completa, retornar como está
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Detectar o tipo baseado no caminho
  if (path.includes('escudos') || path.includes('team')) {
    return getTeamLogoUrl(path);
  }
  
  if (path.includes('logo-competition') || path.includes('competition')) {
    return getCompetitionLogoUrl(path);
  }
  
  if (path.includes('players') || path.includes('player')) {
    return getPlayerImageUrl(path);
  }

  if (path.includes('estadios') || path.includes('stadium')) {
    return getStadiumImageUrl(path);
  }
  
  // Fallback: assumir que é escudo de time
  return getTeamLogoUrl(path);
}

/**
 * Manipulador de erro para imagens
 * @param event - Evento de erro da imagem
 * @param fallbackType - Tipo de fallback
 * @param name - Nome para o fallback
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>, 
  fallbackType: 'team' | 'competition' | 'player' | 'stadium' = 'team',
  name?: string
) {
  const target = event.currentTarget;
  const fallbackUrl = generateFallbackUrl(fallbackType, name);
  
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
} 