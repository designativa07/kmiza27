/**
 * Utilitários para gerenciar URLs do CDN de imagens no backend
 */

const CDN_BASE_URL = 'https://cdn.kmiza27.com';

/**
 * Converte uma URL de imagem para o CDN
 * @param imageUrl - URL original da imagem
 * @param type - Tipo da imagem (escudos, logo-competition, players)
 * @returns URL completa do CDN
 */
export function convertToCdnUrl(
  imageUrl: string | null | undefined,
  type: 'escudos' | 'logo-competition' | 'players' = 'escudos'
): string | null {
  if (!imageUrl) {
    return null;
  }

  // Se já é uma URL completa do CDN, retornar como está
  if (imageUrl.startsWith('https://cdn.kmiza27.com')) {
    return imageUrl;
  }

  // Se é uma URL externa (http/https), retornar como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Converter URLs relativas para CDN
  if (imageUrl.startsWith('/uploads/escudos/')) {
    const filename = imageUrl.replace('/uploads/escudos/', '');
    return `${CDN_BASE_URL}/img/escudos/${filename}`;
  }

  if (imageUrl.startsWith('/img/')) {
    return `${CDN_BASE_URL}${imageUrl}`;
  }

  // Se é apenas o nome do arquivo, assumir o tipo passado como parâmetro
  if (!imageUrl.includes('/') && (
    imageUrl.endsWith('.svg') || 
    imageUrl.endsWith('.png') || 
    imageUrl.endsWith('.jpg') || 
    imageUrl.endsWith('.jpeg') ||
    imageUrl.endsWith('.gif')
  )) {
    return `${CDN_BASE_URL}/img/${type}/${imageUrl}`;
  }

  // Para URLs relativas que não seguem o padrão esperado
  if (imageUrl.startsWith('/')) {
    return `${CDN_BASE_URL}${imageUrl}`;
  }

  // Fallback: retornar a URL original
  return imageUrl;
}

/**
 * Converte URL de escudo de time para CDN
 */
export function getTeamLogoCdnUrl(logoUrl: string | null | undefined): string | null {
  return convertToCdnUrl(logoUrl, 'escudos');
}

/**
 * Converte URL de logo de competição para CDN
 */
export function getCompetitionLogoCdnUrl(logoUrl: string | null | undefined): string | null {
  return convertToCdnUrl(logoUrl, 'logo-competition');
}

/**
 * Converte URL de foto de jogador para CDN
 */
export function getPlayerImageCdnUrl(imageUrl: string | null | undefined): string | null {
  return convertToCdnUrl(imageUrl, 'players');
}

/**
 * Interceptador para converter URLs em responses da API
 * Converte automaticamente campos de imagem para URLs do CDN
 */
export function transformImageUrlsInResponse(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => transformImageUrlsInResponse(item));
  }

  if (typeof data === 'object') {
    const transformed = { ...data };

    // Converter logo_url de times
    if (transformed.logo_url && (transformed.name || transformed.short_name)) {
      transformed.logo_url = getTeamLogoCdnUrl(transformed.logo_url);
    }

    // Converter logo_url de competições
    if (transformed.logo_url && (transformed.slug || transformed.type)) {
      transformed.logo_url = getCompetitionLogoCdnUrl(transformed.logo_url);
    }

    // Converter image_url de jogadores
    if (transformed.image_url && transformed.position) {
      transformed.image_url = getPlayerImageCdnUrl(transformed.image_url);
    }

    // Processar objetos aninhados
    if (transformed.team && transformed.team.logo_url) {
      transformed.team.logo_url = getTeamLogoCdnUrl(transformed.team.logo_url);
    }

    if (transformed.home_team && transformed.home_team.logo_url) {
      transformed.home_team.logo_url = getTeamLogoCdnUrl(transformed.home_team.logo_url);
    }

    if (transformed.away_team && transformed.away_team.logo_url) {
      transformed.away_team.logo_url = getTeamLogoCdnUrl(transformed.away_team.logo_url);
    }

    if (transformed.competition && transformed.competition.logo_url) {
      transformed.competition.logo_url = getCompetitionLogoCdnUrl(transformed.competition.logo_url);
    }

    if (transformed.player && transformed.player.image_url) {
      transformed.player.image_url = getPlayerImageCdnUrl(transformed.player.image_url);
    }

    // Recursivamente processar outros objetos aninhados
    Object.keys(transformed).forEach(key => {
      if (typeof transformed[key] === 'object' && transformed[key] !== null) {
        transformed[key] = transformImageUrlsInResponse(transformed[key]);
      }
    });

    return transformed;
  }

  return data;
} 