/**
 * Utilitários para gerenciar URLs do CDN de imagens no backend
 */

const CDN_BASE_URL = 'https://cdn.kmiza27.com';

/**
 * Converte uma URL de imagem para o CDN
 * @param imageUrl - URL original da imagem
 * @param type - Tipo da imagem (escudos, logo-competition, players, estadios)
 * @returns URL completa do CDN
 */
export function convertToCdnUrl(
  imageUrl: string | null | undefined,
  type: 'escudos' | 'logo-competition' | 'players' | 'estadios' = 'escudos'
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

  if (imageUrl.startsWith('/uploads/estadios/')) {
    const filename = imageUrl.replace('/uploads/estadios/', '');
    return `${CDN_BASE_URL}/img/estadios/${filename}`;
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
 * Converte URL de imagem de estádio para CDN
 */
export function getStadiumImageCdnUrl(imageUrl: string | null | undefined): string | null {
  return convertToCdnUrl(imageUrl, 'estadios');
}

/**
 * Interceptador para converter URLs em responses da API
 * Converte automaticamente campos de imagem para URLs do CDN
 */
export function transformImageUrlsInResponse(data: any, visited = new WeakSet()): any {
  if (!data) return data;

  // Proteção contra referências circulares
  if (typeof data === 'object' && data !== null) {
    if (visited.has(data)) {
      return data; // Já processado, evita loop infinito
    }
    visited.add(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => transformImageUrlsInResponse(item, visited));
  }

  if (typeof data === 'object') {
    // Se é uma instância de Date, retornar como está
    if (data instanceof Date) {
      return data;
    }

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

    // Converter image_url de estádios
    if (transformed.image_url && (transformed.capacity || transformed.city)) {
      transformed.image_url = getStadiumImageCdnUrl(transformed.image_url);
    }

    // Processar objetos aninhados específicos (evitando recursão desnecessária)
    if (transformed.team && typeof transformed.team === 'object' && transformed.team.logo_url) {
      transformed.team.logo_url = getTeamLogoCdnUrl(transformed.team.logo_url);
    }

    if (transformed.home_team && typeof transformed.home_team === 'object' && transformed.home_team.logo_url) {
      transformed.home_team.logo_url = getTeamLogoCdnUrl(transformed.home_team.logo_url);
    }

    if (transformed.away_team && typeof transformed.away_team === 'object' && transformed.away_team.logo_url) {
      transformed.away_team.logo_url = getTeamLogoCdnUrl(transformed.away_team.logo_url);
    }

    if (transformed.competition && typeof transformed.competition === 'object' && transformed.competition.logo_url) {
      transformed.competition.logo_url = getCompetitionLogoCdnUrl(transformed.competition.logo_url);
    }

    if (transformed.player && typeof transformed.player === 'object' && transformed.player.image_url) {
      transformed.player.image_url = getPlayerImageCdnUrl(transformed.player.image_url);
    }

    // Processar apenas campos específicos conhecidos para evitar recursão desnecessária
    const fieldsToProcess = ['data', 'matches', 'teams', 'competitions', 'players', 'stadiums'];
    fieldsToProcess.forEach(key => {
      if (transformed[key] && typeof transformed[key] === 'object' && transformed[key] !== null) {
        transformed[key] = transformImageUrlsInResponse(transformed[key], visited);
      }
    });

    return transformed;
  }

  return data;
} 